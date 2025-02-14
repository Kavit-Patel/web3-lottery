#![allow(clippy::result_large_err)]
use anchor_lang::{
  prelude::*,
  solana_program::
      {
        system_instruction,
        sysvar::clock::Clock
      }
};

declare_id!("AQLmmdbK9bSZPq77LG5mvBaYJyDmP5phge98VNcv8VnZ");

#[program]
pub mod lottery {
  use super::*;

  pub fn initialize_lottery(ctx: Context<InitializeLottery>, title: String, deadline: i64,platform_fee_bps: u64, platform_wallet: Pubkey) -> Result<()> {
      require!(platform_fee_bps <= 5000, ErrorCode::InvalidFee);
      let clock = Clock::get()?;
      require!(deadline > clock.unix_timestamp, ErrorCode::InvalidDeadline);
      let escrow_wallet_key = ctx.accounts.escrow_wallet.key();
      let lottery_account = &mut ctx.accounts.lottery;
      let escrow_wallet = &mut ctx.accounts.escrow_wallet;
      
      lottery_account.title = title;
      lottery_account.owner = ctx.accounts.signer.key();
      lottery_account.deadline = deadline;
      lottery_account.platform_fee_bps = platform_fee_bps;
      lottery_account.platform_wallet = platform_wallet;
      lottery_account.lottery_bump = ctx.bumps.lottery;
      lottery_account.escrow_bump = ctx.bumps.escrow_wallet;
      lottery_account.claimable_bump =0;
      lottery_account.status = LotteryStatus::Active;
      lottery_account.escrow_wallet =escrow_wallet_key;
      lottery_account.claimable_wallet = Pubkey::default();
      lottery_account.lottery_drawer = Pubkey::default();
      escrow_wallet.creator = ctx.accounts.signer.key();
      
      emit!(LotteryEvent {
          event_type: "initialize".to_string(),
          lottery: lottery_account.key(),
          timestamp: clock.unix_timestamp
      });

      Ok(())
  }

  pub fn buy_ticket(ctx: Context<Buyer>, amount: u64) -> Result<()> {
      let lottery_account = &mut ctx.accounts.lottery;
      let clock = Clock::get()?;

      require!(lottery_account.status == LotteryStatus::Active, ErrorCode::LotteryClosed);
      require!(clock.unix_timestamp < lottery_account.deadline, ErrorCode::DeadlinePassed);
      require!(amount > 0, ErrorCode::InvalidAmount);
      
      let total_entry = lottery_account.total_entry.checked_add(1).ok_or(ErrorCode::Overflow)?;
      let total_amount= lottery_account.total_amount.checked_add(amount).ok_or(ErrorCode::Overflow)?;

      lottery_account.total_entry = total_entry;
      lottery_account.total_amount =total_amount;

      anchor_lang::solana_program::program::invoke(
          &system_instruction::transfer(
              &ctx.accounts.signer.key(),
              &ctx.accounts.escrow_wallet.key(),
              amount
          ),
          &[
              ctx.accounts.signer.to_account_info(),
              ctx.accounts.escrow_wallet.to_account_info(),
              ctx.accounts.system_program.to_account_info(),
          ]
      )?;

      lottery_account.participants.push(Participant {
          pubkey: ctx.accounts.signer.key(),
          ticket: total_entry
      });

      emit!(TicketEvent {
          buyer: ctx.accounts.signer.key(),
          amount,
          total_entries: lottery_account.total_entry,
          lottery: lottery_account.key()
      });

      Ok(())
  }

  pub fn choose_winner(ctx: Context<ChooseWinner>,randomness_helper:u64) -> Result<()> {
      let lottery_account = &mut ctx.accounts.lottery;
      let clock = Clock::get()?;
      
      require!(lottery_account.status == LotteryStatus::Active, ErrorCode::LotteryClosed);
      require!(lottery_account.total_entry > 0, ErrorCode::NoEntries);
      require!(lottery_account.winner.is_none(), ErrorCode::WinnerAlreadyChosen);
      require!(lottery_account.deadline<clock.unix_timestamp,ErrorCode::DeadlineNotPassed);
      let winner_ticket = (clock.slot*randomness_helper) % lottery_account.total_entry+1 as u64;

      require!(winner_ticket<=lottery_account.total_entry,ErrorCode::RandomnessError);
      lottery_account.winner = lottery_account.participants.iter()
          .find(|p| p.ticket == winner_ticket) 
          .map(|p| p.pubkey);

      lottery_account.status = LotteryStatus::WinnerSelected;
      lottery_account.lottery_drawer = ctx.accounts.signer.key();

      emit!(WinnerEvent {
          winner: lottery_account.winner.unwrap(),
          lottery: lottery_account.key(),
          timestamp: clock.unix_timestamp
      });

      Ok(())
  }
  pub fn transfer_to_claimable_wallet(ctx:Context<TransferToCalimableWallet>)->Result<()>{
    let lottery_account = &mut ctx.accounts.lottery;
    require!(lottery_account.status == LotteryStatus::WinnerSelected, ErrorCode::InvalidState);
    
    let escrow_lamports = ctx.accounts.escrow_wallet.get_lamports();
    let rent = Rent::get()?;
    let required_lamports = rent.minimum_balance(8 + EscrowWallet::INIT_SPACE);
    let prize_amount = escrow_lamports.checked_sub(required_lamports).ok_or(ErrorCode::InsufficientFunds)?;
    require!(
      ctx.accounts.escrow_wallet.creator == ctx.accounts.signer.key(),
      ErrorCode::Unauthorized
  );

  
    let fee_amount = prize_amount
    .checked_mul(lottery_account.platform_fee_bps.into())
    .and_then(|v| v.checked_div(10000))
    .ok_or(ErrorCode::FeeCalculationError)?;

    let winner_amount = prize_amount.checked_sub(fee_amount)
    .ok_or(ErrorCode::FeeCalculationError)?;

    **ctx.accounts.escrow_wallet.to_account_info().try_borrow_mut_lamports()? -= fee_amount;
    **ctx.accounts.platform_wallet.to_account_info().try_borrow_mut_lamports()? += fee_amount;

    **ctx.accounts.escrow_wallet.to_account_info().try_borrow_mut_lamports()? -= winner_amount;
    **ctx.accounts.claimable_wallet.to_account_info().try_borrow_mut_lamports()? += winner_amount;

    lottery_account.claimable_wallet = ctx.accounts.claimable_wallet.key();
    lottery_account.claimable_bump = ctx.bumps.claimable_wallet;
    let claimabale_account = &mut ctx.accounts.claimable_wallet;
    claimabale_account.creator = ctx.accounts.signer.key();

    Ok(())
  }

  pub fn claim_prize(ctx: Context<ClaimPrize>) -> Result<()> {
      let lottery_account = &mut ctx.accounts.lottery;
      let clock = Clock::get()?;
      
      require!(lottery_account.status == LotteryStatus::WinnerSelected, ErrorCode::InvalidState);
      require!(lottery_account.winner.unwrap() == ctx.accounts.winner.key(), ErrorCode::Unauthorized);

      let claimable_lamports = ctx.accounts.claimable_wallet.get_lamports();
      let _ = claimable_lamports.checked_sub(Rent::get()?.minimum_balance(0)).ok_or(ErrorCode::InsufficientFunds)?;

      
    let rent = Rent::get()?;
    let required_lamports = rent.minimum_balance(8 + ClaimableWallet::INIT_SPACE);
    let prize_amount = claimable_lamports.checked_sub(required_lamports).ok_or(ErrorCode::InsufficientFunds)?;

    **ctx.accounts.claimable_wallet.to_account_info().try_borrow_mut_lamports()? -= prize_amount;
    **ctx.accounts.winner.to_account_info().try_borrow_mut_lamports()? += prize_amount;
  

      lottery_account.status = LotteryStatus::Completed;

      emit!(PayoutEvent {
          winner: ctx.accounts.winner.key(),
          amount: prize_amount,
          lottery: lottery_account.key(),
          timestamp: clock.unix_timestamp
      });

      Ok(())
  }
}

#[account]
#[derive(InitSpace)]
pub struct LotteryState {
  #[max_len(50)]
  pub title: String,
  pub owner: Pubkey,
  pub deadline: i64, 
  pub total_amount: u64,
  pub total_entry: u64,
  pub platform_fee_bps: u64,       
  pub platform_wallet: Pubkey,      
  pub lottery_bump: u8,
  pub escrow_bump: u8,
  pub claimable_bump: u8,
  pub escrow_wallet:Pubkey,
  pub claimable_wallet:Pubkey,
  pub status: LotteryStatus,
  pub winner: Option<Pubkey>,
  pub lottery_drawer:Pubkey,
  #[max_len(100)]
  pub participants: Vec<Participant>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace, PartialEq)]
pub enum LotteryStatus {
  Active,
  WinnerSelected,
  Completed,
}
#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct Participant { 
  pub pubkey: Pubkey,
  pub ticket: u64, 
}

#[account]
#[derive(InitSpace)]
pub struct EscrowWallet {
  pub creator:Pubkey,
}
#[account]
#[derive(InitSpace)]
pub struct ClaimableWallet {
  pub creator:Pubkey,
}

#[event]
pub struct LotteryEvent {
  pub event_type: String,
  pub lottery: Pubkey,
  pub timestamp: i64,
}

#[event]
pub struct TicketEvent {
  pub buyer: Pubkey,
  pub amount: u64,
  pub total_entries: u64,
  pub lottery: Pubkey,
}

#[event]
pub struct WinnerEvent {
  pub winner: Pubkey,
  pub lottery: Pubkey,
  pub timestamp: i64,
}

#[event]
pub struct PayoutEvent {
  pub winner: Pubkey,
  pub amount: u64,
  pub lottery: Pubkey,
  pub timestamp: i64,
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct InitializeLottery<'info> {
  #[account(
      init,
      payer = signer,
      space = 8 + LotteryState::INIT_SPACE,
      seeds = [b"lottery", signer.key().as_ref(), title.as_bytes()],
      bump
  )]
  pub lottery: Account<'info, LotteryState>,
  
  #[account(
      init,
      payer = signer,
      seeds = [b"escrow", signer.key().as_ref(), lottery.key().as_ref()],
      bump,
      space = 8 +EscrowWallet::INIT_SPACE
  )]
  pub escrow_wallet: Account<'info,EscrowWallet>,
  
  #[account(mut)]
  pub signer: Signer<'info>,
  pub system_program: Program<'info, System>,
  pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct Buyer<'info> {
  #[account(mut,has_one=escrow_wallet)]
  pub lottery: Account<'info, LotteryState>,
  #[account(mut)]
  pub escrow_wallet: Account<'info,EscrowWallet>,
  #[account(mut)]
  pub signer: Signer<'info>,
  pub system_program: Program<'info, System>,
  pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct ChooseWinner<'info> {
  #[account(mut)]
  pub lottery: Account<'info, LotteryState>,
  #[account(mut)]
  pub signer: Signer<'info>,
  pub clock: Sysvar<'info, Clock>,
}
#[derive(Accounts)]
pub struct TransferToCalimableWallet<'info>{
  #[account(mut,has_one=escrow_wallet,has_one=platform_wallet)]
  pub lottery:Account<'info,LotteryState>,
  #[account(
    mut,
    seeds=[b"escrow",signer.key().as_ref(),lottery.key().as_ref()],
    bump = lottery.escrow_bump
  )]
  pub escrow_wallet:Account<'info,EscrowWallet>,
  #[account(mut)]
  pub platform_wallet:SystemAccount<'info>,
  #[account(mut)]
  pub signer:Signer<'info>,
  #[account(
    init,
    payer=signer,
    space=8 + ClaimableWallet::INIT_SPACE,
    seeds = [b"winner",lottery.key().as_ref(),lottery.winner.ok_or(ErrorCode::NoWinner)?.as_ref()],
    bump
  )]
  pub claimable_wallet:Account<'info,ClaimableWallet>,
  pub system_program:Program<'info,System>
}

#[derive(Accounts)]
pub struct ClaimPrize<'info>{
  #[account(mut,has_one=claimable_wallet)]
  pub lottery:Account<'info,LotteryState>,
  #[account(
    mut,
    seeds=[b"winner",lottery.key().as_ref(),lottery.winner.ok_or(ErrorCode::NoWinner)?.as_ref()],
    bump=lottery.claimable_bump
  )]
  pub claimable_wallet:Account<'info,ClaimableWallet>,
  #[account(mut)]
  pub winner:Signer<'info>,
  pub system_program:Program<'info,System>,
}


#[error_code]
pub enum ErrorCode {
  #[msg("Invalid fees, max 50% ")]
  InvalidFee,
  #[msg("Invalid deadline")]
  InvalidDeadline,
  #[msg("Lottery is closed")]
  LotteryClosed,
  #[msg("Deadline has passed")]
  DeadlinePassed,
  #[msg("Invalid amount")]
  InvalidAmount,
  #[msg("Arithmetic overflow")]
  Overflow,
  #[msg("Unauthorized access")]
  Unauthorized,
  #[msg("No entries available")]
  NoEntries,
  #[msg("Something wrong in choosing winner")]
  RandomnessError,
  #[msg("Winner already chosen")]
  WinnerAlreadyChosen,
  #[msg("Deadline not passed yet")]
  DeadlineNotPassed,
  #[msg("Invalid program state")]
  InvalidState,
  #[msg("Platform fee calculation error ")]
  FeeCalculationError,
  #[msg("Lottery wallet has no funds")]
  InsufficientFunds,
  #[msg("Winner hasn't been choosen ")]
  NoWinner
}