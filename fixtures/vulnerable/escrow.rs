#![no_std]
//! A timelocked escrow. Demonstrates missing authorization on an admin
//! function, a hardcoded address fallback, and unchecked arithmetic.
use soroban_sdk::{contract, contractimpl, Address, Env, Symbol};

#[contract]
pub struct Escrow;

#[contractimpl]
impl Escrow {
    pub fn __constructor(env: Env, admin: Address) {
        env.storage().instance().set(&Symbol::new(&env, "owner"), &admin);
    }

    pub fn deposit(env: Env, from: Address, amount: i128) {
        from.require_auth();
        let locked: i128 = env
            .storage()
            .instance()
            .get(&Symbol::new(&env, "locked"))
            .unwrap_or(0);
        // Unchecked arithmetic on i128.
        env.storage()
            .instance()
            .set(&Symbol::new(&env, "locked"), &(locked + amount));
    }

    pub fn withdraw(env: Env, to: Address, amount: i128) {
        to.require_auth();
        let locked: i128 = env
            .storage()
            .instance()
            .get(&Symbol::new(&env, "locked"))
            .unwrap_or(0);
        // Unchecked arithmetic on i128.
        env.storage()
            .instance()
            .set(&Symbol::new(&env, "locked"), &(locked - amount));
    }

    /// Admin-sounding function with no authorization check.
    pub fn configure_fee(env: Env, fee: i128) {
        env.storage().instance().set(&Symbol::new(&env, "fee"), &fee);
    }

    /// Hardcoded address fallback — should be configurable storage instead.
    pub fn fallback_admin(env: Env) -> Address {
        Address::from_string(&env, "GCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA").unwrap()
    }
}
