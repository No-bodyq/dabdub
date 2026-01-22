#![cfg(test)]
use crate::{access_control, Vault, VaultClient};
use soroban_sdk::{testutils::Address as _, Address, Env};

#[test]
fn test_initialize() {
    let env = Env::default();
    let contract_id = env.register(Vault, ());
    let client = VaultClient::new(&env, &contract_id);

    let admin = Address::generate(&env);

    client.initialize(&admin);

    assert_eq!(client.get_admin(), admin);
    assert!(client.has_role(&admin, &access_control::ADMIN_ROLE));
}

#[test]
#[should_panic(expected = "Already initialized")]
fn test_cannot_reinitialize() {
    let env = Env::default();
    let contract_id = env.register(Vault, ());
    let client = VaultClient::new(&env, &contract_id);

    let admin = Address::generate(&env);

    client.initialize(&admin);
    client.initialize(&admin); // Should panic
}

#[test]
fn test_grant_role() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Vault, ());
    let client = VaultClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let operator = Address::generate(&env);

    client.initialize(&admin);

    // Grant operator role
    client.grant_role(&admin, &operator, &access_control::OPERATOR_ROLE);

    assert!(client.has_role(&operator, &access_control::OPERATOR_ROLE));
}

#[test]
fn test_revoke_role() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Vault, ());
    let client = VaultClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let operator = Address::generate(&env);

    client.initialize(&admin);
    client.grant_role(&admin, &operator, &access_control::OPERATOR_ROLE);

    // Revoke role
    client.revoke_role(&admin, &operator, &access_control::OPERATOR_ROLE);

    assert!(!client.has_role(&operator, &access_control::OPERATOR_ROLE));
}

#[test]
#[should_panic(expected = "Missing required role")]
fn test_only_admin_can_grant() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Vault, ());
    let client = VaultClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let non_admin = Address::generate(&env);
    let operator = Address::generate(&env);

    client.initialize(&admin);

    // Non-admin tries to grant role - should panic
    client.grant_role(&non_admin, &operator, &access_control::OPERATOR_ROLE);
}

#[test]
fn test_multiple_roles() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Vault, ());
    let client = VaultClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    client.initialize(&admin);

    // Grant multiple roles
    client.grant_role(&admin, &user, &access_control::OPERATOR_ROLE);
    client.grant_role(&admin, &user, &access_control::TREASURER_ROLE);

    assert!(client.has_role(&user, &access_control::OPERATOR_ROLE));
    assert!(client.has_role(&user, &access_control::TREASURER_ROLE));
}

#[test]
fn test_has_role_returns_false() {
    let env = Env::default();
    let contract_id = env.register(Vault, ());
    let client = VaultClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    client.initialize(&admin);

    assert!(!client.has_role(&user, &access_control::OPERATOR_ROLE));
}
