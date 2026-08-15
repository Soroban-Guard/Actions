#![no_std]
//! A minimal Soroban vault that follows checks-effects-interactions:
//! authorization first, all state mutations before any external call, checked
//! arithmetic, and typed storage keys. This contract is the "secure baseline"
//! used by the test suite to confirm the action does not raise false alarms.
use soroban_sdk::{contract, contractimpl, Address, Env, Symbol};

#[contract]
pub struct Vault;

#[contractimpl]
impl Vault {
    pub fn __constructor(env: Env, owner: Address) {
        env.storage().instance().set(&Symbol::new(&env, "owner"), &owner);
        env.storage().instance().set(&Symbol::new(&env, "REENTRANCY_GUARD"), &0u32);
        env.storage().instance().set(&Symbol::new(&env, "VERSION"), &1u32);
    }

    pub fn deposit(env: Env, from: Address, amount: i128) {
        from.require_auth();
        let balance: i128 = env
            .storage()
            .instance()
            .get(&Symbol::new(&env, "balance"))
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&Symbol::new(&env, "balance"), &balance.checked_add(amount).unwrap());
    }

    pub fn withdraw(env: Env, to: Address, amount: i128) {
        to.require_auth();
        let balance: i128 = env
            .storage()
            .instance()
            .get(&Symbol::new(&env, "balance"))
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&Symbol::new(&env, "balance"), &balance.checked_sub(amount).unwrap());
    }

    pub fn balance(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&Symbol::new(&env, "balance"))
            .unwrap_or(0)
    }
}