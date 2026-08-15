#![no_std]
//! A constant-product AMM pair. Demonstrates checks-effects-interactions
//! violations (state written after an external call), division by a variable,
//! and unchecked arithmetic.
use soroban_sdk::{contract, contractimpl, Address, Env, Symbol};

#[contract]
pub struct AmmPair;

#[contractimpl]
impl AmmPair {
    pub fn __constructor(env: Env, token_a: Address, token_b: Address) {
        env.storage().instance().set(&Symbol::new(&env, "token_a"), &token_a);
        env.storage().instance().set(&Symbol::new(&env, "token_b"), &token_b);
        env.storage().instance().set(&Symbol::new(&env, "reserve_a"), &0i128);
        env.storage().instance().set(&Symbol::new(&env, "reserve_b"), &0i128);
    }

    pub fn add_liquidity(env: Env, user: Address, amount_a: i128, amount_b: i128) {
        user.require_auth();
        let reserve_a: i128 = env
            .storage()
            .instance()
            .get(&Symbol::new(&env, "reserve_a"))
            .unwrap_or(0);
        let reserve_b: i128 = env
            .storage()
            .instance()
            .get(&Symbol::new(&env, "reserve_b"))
            .unwrap_or(0);
        // Unchecked arithmetic on i128.
        env.storage()
            .instance()
            .set(&Symbol::new(&env, "reserve_a"), &(reserve_a + amount_a));
        env.storage()
            .instance()
            .set(&Symbol::new(&env, "reserve_b"), &(reserve_b + amount_b));
    }

    pub fn swap(env: Env, user: Address, token: Address, amount_in: i128) {
        let reserve_a: i128 = env
            .storage()
            .instance()
            .get(&Symbol::new(&env, "reserve_a"))
            .unwrap_or(0);
        let reserve_b: i128 = env
            .storage()
            .instance()
            .get(&Symbol::new(&env, "reserve_b"))
            .unwrap_or(0);
        // Division by a variable divisor (could be zero) and unchecked multiply.
        let amount_out = (reserve_b * amount_in) / reserve_a;
        // External call happens BEFORE the state update — reentrancy risk.
        env.invoke_contract::<()>(&token, &Symbol::new(&env, "transfer"), (&user, &amount_out));
        env.storage()
            .instance()
            .set(&Symbol::new(&env, "reserve_a"), &(reserve_a + amount_in));
        env.storage()
            .instance()
            .set(&Symbol::new(&env, "reserve_b"), &(reserve_b - amount_out));
    }
}
