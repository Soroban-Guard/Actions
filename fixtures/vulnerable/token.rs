#![no_std]
//! A fungible token. Intentionally contains realistic-but-unsafe patterns so
//! the examples demonstrate real findings: unchecked arithmetic, a missing
//! auth check on `mint`, and generic storage keys.
use soroban_sdk::{contract, contractimpl, Address, Env, Symbol};

#[contract]
pub struct Token;

#[contractimpl]
impl Token {
    pub fn __constructor(env: Env, admin: Address) {
        env.storage().instance().set(&Symbol::new(&env, "admin"), &admin);
        env.storage().instance().set(&Symbol::new(&env, "supply"), &0i128);
    }

    /// No authorization check — anyone can mint to any account.
    pub fn mint(env: Env, to: Address, amount: i128) {
        let supply: i128 = env
            .storage()
            .instance()
            .get(&Symbol::new(&env, "supply"))
            .unwrap_or(0);
        // Unchecked arithmetic on i128.
        env.storage()
            .instance()
            .set(&Symbol::new(&env, "supply"), &(supply + amount));
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        let balance: i128 = env
            .storage()
            .instance()
            .get(&Symbol::new(&env, "balance"))
            .unwrap_or(0);
        // Unchecked arithmetic on i128.
        env.storage()
            .instance()
            .set(&Symbol::new(&env, "balance"), &(balance - amount));
    }

    pub fn balance(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&Symbol::new(&env, "balance"))
            .unwrap_or(0)
    }
}
