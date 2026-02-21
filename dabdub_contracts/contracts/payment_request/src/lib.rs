#![no_std]

mod test;

use soroban_sdk::{
    contract, contractevent, contractimpl, contracttype, Address, BytesN, Env,
};

// --- Types ---

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum PaymentRequestStatus {
    Pending,
    Paid,
    Cancelled,
    Expired,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct PaymentRequest {
    pub request_id: BytesN<32>,
    pub merchant: Address,
    pub amount: i128,
    pub reference: BytesN<32>,
    pub status: PaymentRequestStatus,
    pub created_at: u64,
    pub expires_at: u64,
    pub paid_at: Option<u64>,
    pub payment_id: Option<BytesN<32>>,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Operator,
    Vault,
    Paused,
    MinAmount,
    MaxAmount,
    Request(BytesN<32>),
    ReferenceIndex(BytesN<32>),
    TotalRequests,
    PendingRequests,
}

// --- Events ---

#[contractevent(topics = ["PAY_REQ", "created"])]
struct PaymentRequestCreatedEvent {
    request_id: BytesN<32>,
    merchant: Address,
    amount: i128,
    expires_at: u64,
}

#[contractevent(topics = ["PAY_REQ", "paid"])]
struct PaymentRequestPaidEvent {
    request_id: BytesN<32>,
    payment_id: BytesN<32>,
    paid_at: u64,
}

#[contractevent(topics = ["PAY_REQ", "cancelled"])]
struct PaymentRequestCancelledEvent {
    request_id: BytesN<32>,
}

#[contractevent(topics = ["PAY_REQ", "expired"])]
struct PaymentRequestExpiredEvent {
    request_id: BytesN<32>,
}

#[contractevent(topics = ["PAY_REQ", "config"])]
struct OperatorUpdatedEvent {
    old_operator: Address,
    new_operator: Address,
}

#[contractevent(topics = ["PAY_REQ", "config"])]
struct MinAmountUpdatedEvent {
    old_min: i128,
    new_min: i128,
}

#[contractevent(topics = ["PAY_REQ", "config"])]
struct MaxAmountUpdatedEvent {
    old_max: i128,
    new_max: i128,
}

// --- Contract ---

#[contract]
pub struct PaymentRequestContract;

#[contractimpl]
impl PaymentRequestContract {
    /// Constructor - initialize contract config
    pub fn __constructor(
        env: Env,
        admin: Address,
        operator: Address,
        vault: Address,
        min_amount: i128,
        max_amount: i128,
    ) {
        if min_amount <= 0 {
            panic!("Min amount must be > 0");
        }
        if max_amount <= 0 {
            panic!("Max amount must be > 0");
        }
        if min_amount >= max_amount {
            panic!("Min amount must be less than max amount");
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Operator, &operator);
        env.storage().instance().set(&DataKey::Vault, &vault);
        env.storage().instance().set(&DataKey::Paused, &false);
        env.storage()
            .instance()
            .set(&DataKey::MinAmount, &min_amount);
        env.storage()
            .instance()
            .set(&DataKey::MaxAmount, &max_amount);
        env.storage()
            .instance()
            .set(&DataKey::TotalRequests, &0u64);
        env.storage()
            .instance()
            .set(&DataKey::PendingRequests, &0u64);
    }

    /// Create a new payment request
    pub fn create_request(
        env: Env,
        caller: Address,
        request_id: BytesN<32>,
        amount: i128,
        reference: BytesN<32>,
        expires_at: u64,
    ) -> BytesN<32> {
        caller.require_auth();

        let paused: bool = env
            .storage()
            .instance()
            .get(&DataKey::Paused)
            .unwrap_or(false);
        if paused {
            panic!("Contract is paused");
        }

        if amount <= 0 {
            panic!("Amount must be > 0");
        }

        let min_amount: i128 = env.storage().instance().get(&DataKey::MinAmount).unwrap();
        let max_amount: i128 = env.storage().instance().get(&DataKey::MaxAmount).unwrap();

        if amount < min_amount {
            panic!("Amount below minimum");
        }
        if amount > max_amount {
            panic!("Amount above maximum");
        }

        let current_time = env.ledger().timestamp();
        if expires_at <= current_time {
            panic!("Expiry must be in the future");
        }

        // Check duplicate request_id
        if env
            .storage()
            .persistent()
            .has(&DataKey::Request(request_id.clone()))
        {
            panic!("Request ID already exists");
        }

        // Check duplicate reference via index
        if env
            .storage()
            .persistent()
            .has(&DataKey::ReferenceIndex(reference.clone()))
        {
            panic!("Reference already exists");
        }

        let request = PaymentRequest {
            request_id: request_id.clone(),
            merchant: caller.clone(),
            amount,
            reference: reference.clone(),
            status: PaymentRequestStatus::Pending,
            created_at: current_time,
            expires_at,
            paid_at: None,
            payment_id: None,
        };

        // Store request
        env.storage()
            .persistent()
            .set(&DataKey::Request(request_id.clone()), &request);

        // Store reference index
        env.storage()
            .persistent()
            .set(&DataKey::ReferenceIndex(reference), &request_id);

        // Update counters
        let mut total: u64 = env
            .storage()
            .instance()
            .get(&DataKey::TotalRequests)
            .unwrap_or(0);
        total += 1;
        env.storage()
            .instance()
            .set(&DataKey::TotalRequests, &total);

        let mut pending: u64 = env
            .storage()
            .instance()
            .get(&DataKey::PendingRequests)
            .unwrap_or(0);
        pending += 1;
        env.storage()
            .instance()
            .set(&DataKey::PendingRequests, &pending);

        PaymentRequestCreatedEvent {
            request_id: request_id.clone(),
            merchant: caller,
            amount,
            expires_at,
        }
        .publish(&env);

        request_id
    }

    /// Mark a payment request as paid (operator or admin only)
    pub fn mark_paid(env: Env, caller: Address, request_id: BytesN<32>, payment_id: BytesN<32>) {
        caller.require_auth();
        Self::require_operator_or_admin(&env, &caller);

        let mut request: PaymentRequest = env
            .storage()
            .persistent()
            .get(&DataKey::Request(request_id.clone()))
            .expect("Request not found");

        if request.status != PaymentRequestStatus::Pending {
            panic!("Request is not pending");
        }

        let paid_at = env.ledger().timestamp();
        request.status = PaymentRequestStatus::Paid;
        request.paid_at = Some(paid_at);
        request.payment_id = Some(payment_id.clone());

        env.storage()
            .persistent()
            .set(&DataKey::Request(request_id.clone()), &request);

        // Decrement pending counter
        let mut pending: u64 = env
            .storage()
            .instance()
            .get(&DataKey::PendingRequests)
            .unwrap_or(0);
        if pending > 0 {
            pending -= 1;
        }
        env.storage()
            .instance()
            .set(&DataKey::PendingRequests, &pending);

        PaymentRequestPaidEvent {
            request_id,
            payment_id,
            paid_at,
        }
        .publish(&env);
    }

    /// Cancel a payment request (merchant who created it, or admin)
    pub fn cancel_request(env: Env, caller: Address, request_id: BytesN<32>) {
        caller.require_auth();

        let mut request: PaymentRequest = env
            .storage()
            .persistent()
            .get(&DataKey::Request(request_id.clone()))
            .expect("Request not found");

        if request.status != PaymentRequestStatus::Pending {
            panic!("Request is not pending");
        }

        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if caller != request.merchant && caller != admin {
            panic!("Not authorized to cancel");
        }

        request.status = PaymentRequestStatus::Cancelled;

        env.storage()
            .persistent()
            .set(&DataKey::Request(request_id.clone()), &request);

        // Decrement pending counter
        let mut pending: u64 = env
            .storage()
            .instance()
            .get(&DataKey::PendingRequests)
            .unwrap_or(0);
        if pending > 0 {
            pending -= 1;
        }
        env.storage()
            .instance()
            .set(&DataKey::PendingRequests, &pending);

        PaymentRequestCancelledEvent { request_id }.publish(&env);
    }

    /// Mark a payment request as expired (operator or admin only)
    pub fn mark_expired(env: Env, caller: Address, request_id: BytesN<32>) {
        caller.require_auth();
        Self::require_operator_or_admin(&env, &caller);

        let mut request: PaymentRequest = env
            .storage()
            .persistent()
            .get(&DataKey::Request(request_id.clone()))
            .expect("Request not found");

        if request.status != PaymentRequestStatus::Pending {
            panic!("Request is not pending");
        }

        let current_time = env.ledger().timestamp();
        if current_time < request.expires_at {
            panic!("Request has not expired yet");
        }

        request.status = PaymentRequestStatus::Expired;

        env.storage()
            .persistent()
            .set(&DataKey::Request(request_id.clone()), &request);

        // Decrement pending counter
        let mut pending: u64 = env
            .storage()
            .instance()
            .get(&DataKey::PendingRequests)
            .unwrap_or(0);
        if pending > 0 {
            pending -= 1;
        }
        env.storage()
            .instance()
            .set(&DataKey::PendingRequests, &pending);

        PaymentRequestExpiredEvent { request_id }.publish(&env);
    }

    // --- View Functions ---

    /// Get a payment request by ID
    pub fn get_request(env: Env, request_id: BytesN<32>) -> PaymentRequest {
        env.storage()
            .persistent()
            .get(&DataKey::Request(request_id))
            .expect("Request not found")
    }

    /// Get a payment request by reference hash
    pub fn get_request_by_reference(env: Env, reference: BytesN<32>) -> PaymentRequest {
        let request_id: BytesN<32> = env
            .storage()
            .persistent()
            .get(&DataKey::ReferenceIndex(reference))
            .expect("Reference not found");

        env.storage()
            .persistent()
            .get(&DataKey::Request(request_id))
            .expect("Request not found")
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    pub fn get_operator(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Operator).unwrap()
    }

    pub fn get_vault(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Vault).unwrap()
    }

    pub fn get_min_amount(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::MinAmount).unwrap()
    }

    pub fn get_max_amount(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::MaxAmount).unwrap()
    }

    pub fn get_total_requests(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::TotalRequests)
            .unwrap_or(0)
    }

    pub fn get_pending_requests(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::PendingRequests)
            .unwrap_or(0)
    }

    pub fn is_paused(env: Env) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::Paused)
            .unwrap_or(false)
    }

    // --- Admin Functions ---

    /// Update operator address (admin only)
    pub fn set_operator(env: Env, caller: Address, new_operator: Address) {
        caller.require_auth();
        Self::require_admin(&env, &caller);

        let old_operator: Address = env.storage().instance().get(&DataKey::Operator).unwrap();
        env.storage()
            .instance()
            .set(&DataKey::Operator, &new_operator);

        OperatorUpdatedEvent {
            old_operator,
            new_operator,
        }
        .publish(&env);
    }

    /// Update minimum amount (admin only)
    pub fn set_min_amount(env: Env, caller: Address, new_min: i128) {
        caller.require_auth();
        Self::require_admin(&env, &caller);

        if new_min <= 0 {
            panic!("Min amount must be > 0");
        }

        let max_amount: i128 = env.storage().instance().get(&DataKey::MaxAmount).unwrap();
        if new_min >= max_amount {
            panic!("Min amount must be less than max amount");
        }

        let old_min: i128 = env.storage().instance().get(&DataKey::MinAmount).unwrap();
        env.storage()
            .instance()
            .set(&DataKey::MinAmount, &new_min);

        MinAmountUpdatedEvent {
            old_min,
            new_min,
        }
        .publish(&env);
    }

    /// Update maximum amount (admin only)
    pub fn set_max_amount(env: Env, caller: Address, new_max: i128) {
        caller.require_auth();
        Self::require_admin(&env, &caller);

        if new_max <= 0 {
            panic!("Max amount must be > 0");
        }

        let min_amount: i128 = env.storage().instance().get(&DataKey::MinAmount).unwrap();
        if new_max <= min_amount {
            panic!("Max amount must be greater than min amount");
        }

        let old_max: i128 = env.storage().instance().get(&DataKey::MaxAmount).unwrap();
        env.storage()
            .instance()
            .set(&DataKey::MaxAmount, &new_max);

        MaxAmountUpdatedEvent {
            old_max,
            new_max,
        }
        .publish(&env);
    }

    /// Pause contract (admin only)
    pub fn pause(env: Env, caller: Address) {
        caller.require_auth();
        Self::require_admin(&env, &caller);

        env.storage().instance().set(&DataKey::Paused, &true);
    }

    /// Unpause contract (admin only)
    pub fn unpause(env: Env, caller: Address) {
        caller.require_auth();
        Self::require_admin(&env, &caller);

        env.storage().instance().set(&DataKey::Paused, &false);
    }

    // --- Internal Helpers ---

    fn require_admin(env: &Env, caller: &Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if *caller != admin {
            panic!("Not admin");
        }
    }

    fn require_operator_or_admin(env: &Env, caller: &Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        let operator: Address = env.storage().instance().get(&DataKey::Operator).unwrap();
        if *caller != admin && *caller != operator {
            panic!("Not operator or admin");
        }
    }
}
