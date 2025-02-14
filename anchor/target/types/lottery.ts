/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/lottery.json`.
 */
export type Lottery = {
  "address": "AQLmmdbK9bSZPq77LG5mvBaYJyDmP5phge98VNcv8VnZ",
  "metadata": {
    "name": "lottery",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "buyTicket",
      "discriminator": [
        11,
        24,
        17,
        193,
        168,
        116,
        164,
        169
      ],
      "accounts": [
        {
          "name": "lottery",
          "writable": true
        },
        {
          "name": "escrowWallet",
          "writable": true,
          "relations": [
            "lottery"
          ]
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "chooseWinner",
      "discriminator": [
        94,
        248,
        225,
        4,
        43,
        60,
        118,
        243
      ],
      "accounts": [
        {
          "name": "lottery",
          "writable": true
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "randomnessHelper",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claimPrize",
      "discriminator": [
        157,
        233,
        139,
        121,
        246,
        62,
        234,
        235
      ],
      "accounts": [
        {
          "name": "lottery",
          "writable": true
        },
        {
          "name": "claimableWallet",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  119,
                  105,
                  110,
                  110,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "lottery"
              },
              {
                "kind": "account",
                "path": "lottery.winner.ok_or(ErrorCode :: NoWinner) ? ",
                "account": "lotteryState"
              }
            ]
          },
          "relations": [
            "lottery"
          ]
        },
        {
          "name": "winner",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeLottery",
      "discriminator": [
        113,
        199,
        243,
        247,
        73,
        217,
        33,
        11
      ],
      "accounts": [
        {
          "name": "lottery",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  116,
                  116,
                  101,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "signer"
              },
              {
                "kind": "arg",
                "path": "title"
              }
            ]
          }
        },
        {
          "name": "escrowWallet",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "signer"
              },
              {
                "kind": "account",
                "path": "lottery"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "title",
          "type": "string"
        },
        {
          "name": "deadline",
          "type": "i64"
        },
        {
          "name": "platformFeeBps",
          "type": "u64"
        },
        {
          "name": "platformWallet",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "transferToClaimableWallet",
      "discriminator": [
        71,
        185,
        204,
        46,
        82,
        231,
        54,
        235
      ],
      "accounts": [
        {
          "name": "lottery",
          "writable": true
        },
        {
          "name": "escrowWallet",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "signer"
              },
              {
                "kind": "account",
                "path": "lottery"
              }
            ]
          },
          "relations": [
            "lottery"
          ]
        },
        {
          "name": "platformWallet",
          "writable": true,
          "relations": [
            "lottery"
          ]
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "claimableWallet",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  119,
                  105,
                  110,
                  110,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "lottery"
              },
              {
                "kind": "account",
                "path": "lottery.winner.ok_or(ErrorCode :: NoWinner) ? ",
                "account": "lotteryState"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "claimableWallet",
      "discriminator": [
        50,
        157,
        225,
        234,
        109,
        6,
        201,
        134
      ]
    },
    {
      "name": "escrowWallet",
      "discriminator": [
        238,
        110,
        99,
        88,
        94,
        75,
        187,
        110
      ]
    },
    {
      "name": "lotteryState",
      "discriminator": [
        196,
        210,
        202,
        219,
        204,
        63,
        133,
        85
      ]
    }
  ],
  "events": [
    {
      "name": "lotteryEvent",
      "discriminator": [
        87,
        41,
        253,
        158,
        28,
        212,
        12,
        34
      ]
    },
    {
      "name": "payoutEvent",
      "discriminator": [
        84,
        234,
        195,
        72,
        143,
        79,
        70,
        82
      ]
    },
    {
      "name": "ticketEvent",
      "discriminator": [
        210,
        134,
        105,
        151,
        129,
        16,
        28,
        47
      ]
    },
    {
      "name": "winnerEvent",
      "discriminator": [
        80,
        230,
        123,
        48,
        43,
        207,
        255,
        183
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidFee",
      "msg": "Invalid fees, max 50% "
    },
    {
      "code": 6001,
      "name": "invalidDeadline",
      "msg": "Invalid deadline"
    },
    {
      "code": 6002,
      "name": "lotteryClosed",
      "msg": "Lottery is closed"
    },
    {
      "code": 6003,
      "name": "deadlinePassed",
      "msg": "Deadline has passed"
    },
    {
      "code": 6004,
      "name": "invalidAmount",
      "msg": "Invalid amount"
    },
    {
      "code": 6005,
      "name": "overflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6006,
      "name": "unauthorized",
      "msg": "Unauthorized access"
    },
    {
      "code": 6007,
      "name": "noEntries",
      "msg": "No entries available"
    },
    {
      "code": 6008,
      "name": "randomnessError",
      "msg": "Something wrong in choosing winner"
    },
    {
      "code": 6009,
      "name": "winnerAlreadyChosen",
      "msg": "Winner already chosen"
    },
    {
      "code": 6010,
      "name": "deadlineNotPassed",
      "msg": "Deadline not passed yet"
    },
    {
      "code": 6011,
      "name": "invalidState",
      "msg": "Invalid program state"
    },
    {
      "code": 6012,
      "name": "feeCalculationError",
      "msg": "Platform fee calculation error "
    },
    {
      "code": 6013,
      "name": "insufficientFunds",
      "msg": "Lottery wallet has no funds"
    },
    {
      "code": 6014,
      "name": "noWinner",
      "msg": "Winner hasn't been choosen "
    }
  ],
  "types": [
    {
      "name": "claimableWallet",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "escrowWallet",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "lotteryEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "eventType",
            "type": "string"
          },
          {
            "name": "lottery",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "lotteryState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "deadline",
            "type": "i64"
          },
          {
            "name": "totalAmount",
            "type": "u64"
          },
          {
            "name": "totalEntry",
            "type": "u64"
          },
          {
            "name": "platformFeeBps",
            "type": "u64"
          },
          {
            "name": "platformWallet",
            "type": "pubkey"
          },
          {
            "name": "lotteryBump",
            "type": "u8"
          },
          {
            "name": "escrowBump",
            "type": "u8"
          },
          {
            "name": "claimableBump",
            "type": "u8"
          },
          {
            "name": "escrowWallet",
            "type": "pubkey"
          },
          {
            "name": "claimableWallet",
            "type": "pubkey"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "lotteryStatus"
              }
            }
          },
          {
            "name": "winner",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "lotteryDrawer",
            "type": "pubkey"
          },
          {
            "name": "participants",
            "type": {
              "vec": {
                "defined": {
                  "name": "participant"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "lotteryStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "active"
          },
          {
            "name": "winnerSelected"
          },
          {
            "name": "completed"
          }
        ]
      }
    },
    {
      "name": "participant",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pubkey",
            "type": "pubkey"
          },
          {
            "name": "ticket",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "payoutEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "winner",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "lottery",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "ticketEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "buyer",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "totalEntries",
            "type": "u64"
          },
          {
            "name": "lottery",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "winnerEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "winner",
            "type": "pubkey"
          },
          {
            "name": "lottery",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    }
  ]
};
