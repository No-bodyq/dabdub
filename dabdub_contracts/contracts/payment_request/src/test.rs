#![cfg(test)]

use crate::{PaymentRequestContract, PaymentRequestContractClient, PaymentRequestStatus};
use soroban_sdk::{testutils::Address as _, testutils::Ledger, Address, BytesN, Env};

fn setup_env() -> (
    Env,
    PaymentRequestContractClient<'static>,
    Address,
    Address,
    Address,
) {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let operator = Address::generate(&env);
    let vault = Address::generate(&env);

    let contract_id = env.register(
        PaymentRequestContract,
        (
            &admin,
            &operator,
            &vault,
            &1_000_000i128,   // min: 0.1 USDC
            &100_000_000_000i128, // max: 10,000 USDC
        ),
    );
    let client = PaymentRequestContractClient::new(&env, &contract_id);

    (env, client, admin, operator, vault)
}

fn make_id(env: &Env, seed: u8) -> BytesN<32> {
    BytesN::from_array(env, &[seed; 32])
}

// ========== Constructor Tests ==========

#[test]
fn test_constructor_valid() {
    let (_env, client, admin, operator, vault) = setup_env();

    assert_eq!(client.get_admin(), admin);
    assert_eq!(client.get_operator(), operator);
    assert_eq!(client.get_vault(), vault);
    assert_eq!(client.get_min_amount(), 1_000_000);
    assert_eq!(client.get_max_amount(), 100_000_000_000);
    assert_eq!(client.get_total_requests(), 0);
    assert_eq!(client.get_pending_requests(), 0);
    assert!(!client.is_paused());
}

#[test]
#[should_panic(expected = "Min amount must be less than max amount")]
fn test_constructor_min_gte_max() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let operator = Address::generate(&env);
    let vault = Address::generate(&env);

    env.register(
        PaymentRequestContract,
        (&admin, &operator, &vault, &100i128, &100i128),
    );
}

#[test]
#[should_panic(expected = "Min amount must be > 0")]
fn test_constructor_zero_min() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let operator = Address::generate(&env);
    let vault = Address::generate(&env);

    env.register(
        PaymentRequestContract,
        (&admin, &operator, &vault, &0i128, &100i128),
    );
}

#[test]
#[should_panic(expected = "Max amount must be > 0")]
fn test_constructor_zero_max() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let operator = Address::generate(&env);
    let vault = Address::generate(&env);

    env.register(
        PaymentRequestContract,
        (&admin, &operator, &vault, &1i128, &0i128),
    );
}

// ========== Create Request Tests ==========

#[test]
fn test_create_request_happy_path() {
    let (env, client, _admin, _operator, _vault) = setup_env();
    let merchant = Address::generate(&env);

    env.ledger().set_timestamp(1000);
    let request_id = make_id(&env, 1);
    let reference = make_id(&env, 2);

    let result = client.create_request(&merchant, &request_id, &10_000_000i128, &reference, &2000);

    assert_eq!(result, request_id);
    assert_eq!(client.get_total_requests(), 1);
    assert_eq!(client.get_pending_requests(), 1);

    let req = client.get_request(&request_id);
    assert_eq!(req.merchant, merchant);
    assert_eq!(req.amount, 10_000_000);
    assert_eq!(req.status, PaymentRequestStatus::Pending);
    assert_eq!(req.created_at, 1000);
    assert_eq!(req.expires_at, 2000);
    assert_eq!(req.paid_at, None);
    assert_eq!(req.payment_id, None);
}

#[test]
#[should_panic(expected = "Reference already exists")]
fn test_create_request_duplicate_reference() {
    let (env, client, _admin, _operator, _vault) = setup_env();
    let merchant = Address::generate(&env);

    env.ledger().set_timestamp(1000);
    let reference = make_id(&env, 2);

    client.create_request(&merchant, &make_id(&env, 1), &10_000_000i128, &reference, &2000);
    // Same reference, different request_id
    client.create_request(&merchant, &make_id(&env, 3), &10_000_000i128, &reference, &2000);
}

#[test]
#[should_panic(expected = "Request ID already exists")]
fn test_create_request_duplicate_id() {
    let (env, client, _admin, _operator, _vault) = setup_env();
    let merchant = Address::generate(&env);

    env.ledger().set_timestamp(1000);
    let request_id = make_id(&env, 1);

    client.create_request(&merchant, &request_id, &10_000_000i128, &make_id(&env, 2), &2000);
    client.create_request(&merchant, &request_id, &10_000_000i128, &make_id(&env, 3), &2000);
}

#[test]
#[should_panic(expected = "Amount below minimum")]
fn test_create_request_amount_below_min() {
    let (env, client, _admin, _operator, _vault) = setup_env();
    let merchant = Address::generate(&env);

    env.ledger().set_timestamp(1000);
    // min is 1_000_000, try 500_000
    client.create_request(&merchant, &make_id(&env, 1), &500_000i128, &make_id(&env, 2), &2000);
}

#[test]
#[should_panic(expected = "Amount above maximum")]
fn test_create_request_amount_above_max() {
    let (env, client, _admin, _operator, _vault) = setup_env();
    let merchant = Address::generate(&env);

    env.ledger().set_timestamp(1000);
    // max is 100_000_000_000, try more
    client.create_request(
        &merchant,
        &make_id(&env, 1),
        &200_000_000_000i128,
        &make_id(&env, 2),
        &2000,
    );
}

#[test]
#[should_panic(expected = "Amount must be > 0")]
fn test_create_request_zero_amount() {
    let (env, client, _admin, _operator, _vault) = setup_env();
    let merchant = Address::generate(&env);

    env.ledger().set_timestamp(1000);
    client.create_request(&merchant, &make_id(&env, 1), &0i128, &make_id(&env, 2), &2000);
}

#[test]
#[should_panic(expected = "Expiry must be in the future")]
fn test_create_request_expired_deadline() {
    let (env, client, _admin, _operator, _vault) = setup_env();
    let merchant = Address::generate(&env);

    env.ledger().set_timestamp(1000);
    // expires_at in the past
    client.create_request(&merchant, &make_id(&env, 1), &10_000_000i128, &make_id(&env, 2), &500);
}

#[test]
#[should_panic(expected = "Contract is paused")]
fn test_create_request_paused() {
    let (env, client, admin, _operator, _vault) = setup_env();
    let merchant = Address::generate(&env);

    client.pause(&admin);

    env.ledger().set_timestamp(1000);
    client.create_request(&merchant, &make_id(&env, 1), &10_000_000i128, &make_id(&env, 2), &2000);
}

// ========== Mark Paid Tests ==========

#[test]
fn test_mark_paid_happy_path() {
    let (env, client, _admin, operator, _vault) = setup_env();
    let merchant = Address::generate(&env);

    env.ledger().set_timestamp(1000);
    let request_id = make_id(&env, 1);
    let reference = make_id(&env, 2);
    client.create_request(&merchant, &request_id, &10_000_000i128, &reference, &2000);

    env.ledger().set_timestamp(1500);
    let payment_id = make_id(&env, 10);
    client.mark_paid(&operator, &request_id, &payment_id);

    let req = client.get_request(&request_id);
    assert_eq!(req.status, PaymentRequestStatus::Paid);
    assert_eq!(req.paid_at, Some(1500));
    assert_eq!(req.payment_id, Some(payment_id));
    assert_eq!(client.get_pending_requests(), 0);
}

#[test]
fn test_mark_paid_by_admin() {
    let (env, client, admin, _operator, _vault) = setup_env();
    let merchant = Address::generate(&env);

    env.ledger().set_timestamp(1000);
    let request_id = make_id(&env, 1);
    client.create_request(&merchant, &request_id, &10_000_000i128, &make_id(&env, 2), &2000);

    let payment_id = make_id(&env, 10);
    client.mark_paid(&admin, &request_id, &payment_id);

    let req = client.get_request(&request_id);
    assert_eq!(req.status, PaymentRequestStatus::Paid);
}

#[test]
#[should_panic(expected = "Not operator or admin")]
fn test_mark_paid_not_operator() {
    let (env, client, _admin, _operator, _vault) = setup_env();
    let merchant = Address::generate(&env);
    let random = Address::generate(&env);

    env.ledger().set_timestamp(1000);
    let request_id = make_id(&env, 1);
    client.create_request(&merchant, &request_id, &10_000_000i128, &make_id(&env, 2), &2000);

    client.mark_paid(&random, &request_id, &make_id(&env, 10));
}

#[test]
#[should_panic(expected = "Request is not pending")]
fn test_mark_paid_not_pending() {
    let (env, client, _admin, operator, _vault) = setup_env();
    let merchant = Address::generate(&env);

    env.ledger().set_timestamp(1000);
    let request_id = make_id(&env, 1);
    client.create_request(&merchant, &request_id, &10_000_000i128, &make_id(&env, 2), &2000);

    // Mark paid first time
    client.mark_paid(&operator, &request_id, &make_id(&env, 10));
    // Try again - should fail
    client.mark_paid(&operator, &request_id, &make_id(&env, 11));
}

#[test]
#[should_panic(expected = "Request not found")]
fn test_mark_paid_not_found() {
    let (_env, client, _admin, operator, _vault) = setup_env();
    let fake_id = make_id(&_env, 99);

    client.mark_paid(&operator, &fake_id, &make_id(&_env, 10));
}

// ========== Cancel Request Tests ==========

#[test]
fn test_cancel_by_merchant() {
    let (env, client, _admin, _operator, _vault) = setup_env();
    let merchant = Address::generate(&env);

    env.ledger().set_timestamp(1000);
    let request_id = make_id(&env, 1);
    client.create_request(&merchant, &request_id, &10_000_000i128, &make_id(&env, 2), &2000);

    client.cancel_request(&merchant, &request_id);

    let req = client.get_request(&request_id);
    assert_eq!(req.status, PaymentRequestStatus::Cancelled);
    assert_eq!(client.get_pending_requests(), 0);
}

#[test]
fn test_cancel_by_admin() {
    let (env, client, admin, _operator, _vault) = setup_env();
    let merchant = Address::generate(&env);

    env.ledger().set_timestamp(1000);
    let request_id = make_id(&env, 1);
    client.create_request(&merchant, &request_id, &10_000_000i128, &make_id(&env, 2), &2000);

    client.cancel_request(&admin, &request_id);

    let req = client.get_request(&request_id);
    assert_eq!(req.status, PaymentRequestStatus::Cancelled);
}

#[test]
#[should_panic(expected = "Not authorized to cancel")]
fn test_cancel_unauthorized() {
    let (env, client, _admin, _operator, _vault) = setup_env();
    let merchant = Address::generate(&env);
    let random = Address::generate(&env);

    env.ledger().set_timestamp(1000);
    let request_id = make_id(&env, 1);
    client.create_request(&merchant, &request_id, &10_000_000i128, &make_id(&env, 2), &2000);

    client.cancel_request(&random, &request_id);
}

#[test]
#[should_panic(expected = "Request is not pending")]
fn test_cancel_not_pending() {
    let (env, client, _admin, operator, _vault) = setup_env();
    let merchant = Address::generate(&env);

    env.ledger().set_timestamp(1000);
    let request_id = make_id(&env, 1);
    client.create_request(&merchant, &request_id, &10_000_000i128, &make_id(&env, 2), &2000);

    client.mark_paid(&operator, &request_id, &make_id(&env, 10));
    client.cancel_request(&merchant, &request_id);
}

#[test]
#[should_panic(expected = "Request not found")]
fn test_cancel_not_found() {
    let (env, client, admin, _operator, _vault) = setup_env();
    client.cancel_request(&admin, &make_id(&env, 99));
}

// ========== Mark Expired Tests ==========

#[test]
fn test_mark_expired_happy_path() {
    let (env, client, _admin, operator, _vault) = setup_env();
    let merchant = Address::generate(&env);

    env.ledger().set_timestamp(1000);
    let request_id = make_id(&env, 1);
    client.create_request(&merchant, &request_id, &10_000_000i128, &make_id(&env, 2), &2000);

    // Advance time past expiry
    env.ledger().set_timestamp(2001);
    client.mark_expired(&operator, &request_id);

    let req = client.get_request(&request_id);
    assert_eq!(req.status, PaymentRequestStatus::Expired);
    assert_eq!(client.get_pending_requests(), 0);
}

#[test]
#[should_panic(expected = "Request has not expired yet")]
fn test_mark_expired_not_yet_expired() {
    let (env, client, _admin, operator, _vault) = setup_env();
    let merchant = Address::generate(&env);

    env.ledger().set_timestamp(1000);
    let request_id = make_id(&env, 1);
    client.create_request(&merchant, &request_id, &10_000_000i128, &make_id(&env, 2), &2000);

    // Time still before expiry
    env.ledger().set_timestamp(1500);
    client.mark_expired(&operator, &request_id);
}

#[test]
#[should_panic(expected = "Not operator or admin")]
fn test_mark_expired_not_operator() {
    let (env, client, _admin, _operator, _vault) = setup_env();
    let merchant = Address::generate(&env);
    let random = Address::generate(&env);

    env.ledger().set_timestamp(1000);
    let request_id = make_id(&env, 1);
    client.create_request(&merchant, &request_id, &10_000_000i128, &make_id(&env, 2), &2000);

    env.ledger().set_timestamp(2001);
    client.mark_expired(&random, &request_id);
}

#[test]
#[should_panic(expected = "Request is not pending")]
fn test_mark_expired_not_pending() {
    let (env, client, _admin, operator, _vault) = setup_env();
    let merchant = Address::generate(&env);

    env.ledger().set_timestamp(1000);
    let request_id = make_id(&env, 1);
    client.create_request(&merchant, &request_id, &10_000_000i128, &make_id(&env, 2), &2000);

    client.mark_paid(&operator, &request_id, &make_id(&env, 10));

    env.ledger().set_timestamp(2001);
    client.mark_expired(&operator, &request_id);
}

// ========== Lookup Tests ==========

#[test]
fn test_get_request_by_reference() {
    let (env, client, _admin, _operator, _vault) = setup_env();
    let merchant = Address::generate(&env);

    env.ledger().set_timestamp(1000);
    let request_id = make_id(&env, 1);
    let reference = make_id(&env, 2);
    client.create_request(&merchant, &request_id, &10_000_000i128, &reference, &2000);

    let req = client.get_request_by_reference(&reference);
    assert_eq!(req.request_id, request_id);
    assert_eq!(req.merchant, merchant);
}

#[test]
#[should_panic(expected = "Request not found")]
fn test_get_request_not_found() {
    let (env, client, _admin, _operator, _vault) = setup_env();
    client.get_request(&make_id(&env, 99));
}

#[test]
#[should_panic(expected = "Reference not found")]
fn test_get_request_by_reference_not_found() {
    let (env, client, _admin, _operator, _vault) = setup_env();
    client.get_request_by_reference(&make_id(&env, 99));
}

// ========== Admin Function Tests ==========

#[test]
fn test_set_operator() {
    let (env, client, admin, operator, _vault) = setup_env();
    let new_operator = Address::generate(&env);

    assert_eq!(client.get_operator(), operator);

    client.set_operator(&admin, &new_operator);
    assert_eq!(client.get_operator(), new_operator);
}

#[test]
#[should_panic(expected = "Not admin")]
fn test_set_operator_not_admin() {
    let (env, client, _admin, _operator, _vault) = setup_env();
    let random = Address::generate(&env);
    let new_operator = Address::generate(&env);

    client.set_operator(&random, &new_operator);
}

#[test]
fn test_set_min_amount() {
    let (_env, client, admin, _operator, _vault) = setup_env();

    client.set_min_amount(&admin, &2_000_000i128);
    assert_eq!(client.get_min_amount(), 2_000_000);
}

#[test]
fn test_set_max_amount() {
    let (_env, client, admin, _operator, _vault) = setup_env();

    client.set_max_amount(&admin, &200_000_000_000i128);
    assert_eq!(client.get_max_amount(), 200_000_000_000);
}

#[test]
#[should_panic(expected = "Min amount must be less than max amount")]
fn test_set_min_amount_exceeds_max() {
    let (_env, client, admin, _operator, _vault) = setup_env();
    // max is 100_000_000_000
    client.set_min_amount(&admin, &100_000_000_000i128);
}

#[test]
#[should_panic(expected = "Max amount must be greater than min amount")]
fn test_set_max_amount_below_min() {
    let (_env, client, admin, _operator, _vault) = setup_env();
    // min is 1_000_000
    client.set_max_amount(&admin, &1_000_000i128);
}

#[test]
fn test_pause_unpause() {
    let (_env, client, admin, _operator, _vault) = setup_env();

    client.pause(&admin);
    assert!(client.is_paused());

    client.unpause(&admin);
    assert!(!client.is_paused());
}

#[test]
#[should_panic(expected = "Not admin")]
fn test_pause_not_admin() {
    let (env, client, _admin, _operator, _vault) = setup_env();
    let random = Address::generate(&env);

    client.pause(&random);
}

// ========== Counter Tracking Tests ==========

#[test]
fn test_counter_tracking_multiple_operations() {
    let (env, client, _admin, operator, _vault) = setup_env();
    let merchant = Address::generate(&env);

    env.ledger().set_timestamp(1000);

    // Create 3 requests
    client.create_request(&merchant, &make_id(&env, 1), &10_000_000i128, &make_id(&env, 11), &2000);
    client.create_request(&merchant, &make_id(&env, 2), &20_000_000i128, &make_id(&env, 12), &2000);
    client.create_request(&merchant, &make_id(&env, 3), &30_000_000i128, &make_id(&env, 13), &2000);

    assert_eq!(client.get_total_requests(), 3);
    assert_eq!(client.get_pending_requests(), 3);

    // Mark one paid
    client.mark_paid(&operator, &make_id(&env, 1), &make_id(&env, 20));
    assert_eq!(client.get_total_requests(), 3);
    assert_eq!(client.get_pending_requests(), 2);

    // Cancel one
    client.cancel_request(&merchant, &make_id(&env, 2));
    assert_eq!(client.get_pending_requests(), 1);

    // Expire the last one
    env.ledger().set_timestamp(2001);
    client.mark_expired(&operator, &make_id(&env, 3));
    assert_eq!(client.get_total_requests(), 3);
    assert_eq!(client.get_pending_requests(), 0);
}

#[test]
fn test_mark_expired_at_exact_expiry() {
    let (env, client, _admin, operator, _vault) = setup_env();
    let merchant = Address::generate(&env);

    env.ledger().set_timestamp(1000);
    let request_id = make_id(&env, 1);
    client.create_request(&merchant, &request_id, &10_000_000i128, &make_id(&env, 2), &2000);

    // Set timestamp exactly to expires_at
    env.ledger().set_timestamp(2000);
    client.mark_expired(&operator, &request_id);

    let req = client.get_request(&request_id);
    assert_eq!(req.status, PaymentRequestStatus::Expired);
}
