#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF");

#[program]
pub mod web3lottery {
    use super::*;

  pub fn close(_ctx: Context<CloseWeb3lottery>) -> Result<()> {
    Ok(())
  }

  pub fn decrement(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.web3lottery.count = ctx.accounts.web3lottery.count.checked_sub(1).unwrap();
    Ok(())
  }

  pub fn increment(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.web3lottery.count = ctx.accounts.web3lottery.count.checked_add(1).unwrap();
    Ok(())
  }

  pub fn initialize(_ctx: Context<InitializeWeb3lottery>) -> Result<()> {
    Ok(())
  }

  pub fn set(ctx: Context<Update>, value: u8) -> Result<()> {
    ctx.accounts.web3lottery.count = value.clone();
    Ok(())
  }
}

#[derive(Accounts)]
pub struct InitializeWeb3lottery<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  init,
  space = 8 + Web3lottery::INIT_SPACE,
  payer = payer
  )]
  pub web3lottery: Account<'info, Web3lottery>,
  pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct CloseWeb3lottery<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  mut,
  close = payer, // close account and return lamports to payer
  )]
  pub web3lottery: Account<'info, Web3lottery>,
}

#[derive(Accounts)]
pub struct Update<'info> {
  #[account(mut)]
  pub web3lottery: Account<'info, Web3lottery>,
}

#[account]
#[derive(InitSpace)]
pub struct Web3lottery {
  count: u8,
}
