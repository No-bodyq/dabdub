#![no_std]

mod access_control;
mod test;
mod token_helpers;

use soroban_sdk::{contract, contractimpl, Address, Env, Symbol};

#[contract]
pub struct Vault;

#[contractimpl]
impl Vault {
    /// Initialize vault with admin
    pub fn initialize(env: Env, admin: Address) {
        if env
            .storage()
            .instance()
            .has(&access_control::RoleKey::Admin)
        {
            panic!("Already initialized");
        }

        env.storage()
            .instance()
            .set(&access_control::RoleKey::Admin, &admin);

        // Grant admin role
        access_control::grant_role(&env, admin, access_control::ADMIN_ROLE);
    }

    /// Grant role (admin only)
    pub fn grant_role(env: Env, caller: Address, account: Address, role: Symbol) {
        access_control::require_role(&env, &caller, access_control::ADMIN_ROLE);
        caller.require_auth();

        access_control::grant_role(&env, account, role);
    }

    /// Revoke role (admin only)
    pub fn revoke_role(env: Env, caller: Address, account: Address, role: Symbol) {
        access_control::require_role(&env, &caller, access_control::ADMIN_ROLE);
        caller.require_auth();

        access_control::revoke_role(&env, account, role);
    }

    /// Check if address has role
    pub fn has_role(env: Env, account: Address, role: Symbol) -> bool {
        access_control::has_role(&env, &account, role)
    }

    /// Get admin address
    pub fn get_admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&access_control::RoleKey::Admin)
            .unwrap()
    }
}
