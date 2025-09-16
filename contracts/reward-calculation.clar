(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INVALID-DISTANCE u101)
(define-constant ERR-INVALID-VEHICLE-TYPE u102)
(define-constant ERR-INVALID-RIDE-ID u103)
(define-constant ERR-RIDE-NOT-VERIFIED u104)
(define-constant ERR-INVALID-REWARD-RATE u105)
(define-constant ERR-INSUFFICIENT-TOKEN-BALANCE u106)
(define-constant ERR-INVALID-EMISSION-FACTOR u107)
(define-constant ERR-INVALID-TIMESTAMP u108)
(define-constant ERR-AUTHORITY-NOT-SET u109)
(define-constant ERR-INVALID-MULTIPLIER u110)

(define-data-var admin principal tx-sender)
(define-data-var token-contract principal 'SP000000000000000000002Q6VF78)
(define-data-var verification-contract principal 'SP000000000000000000002Q6VF78)
(define-data-var base-reward-rate uint u10)
(define-data-var bike-bonus uint u5)
(define-data-var max-distance uint u1000)
(define-data-var min-distance uint u1)

(define-map reward-multipliers
  { vehicle-type: (string-ascii 20) }
  { multiplier: uint }
)

(define-map ride-rewards
  { ride-id: uint }
  {
    user: principal,
    distance: uint,
    vehicle-type: (string-ascii 20),
    reward-amount: uint,
    timestamp: uint,
    emission-saved: uint
  }
)

(define-map emission-factors
  { vehicle-type: (string-ascii 20) }
  { co2-per-km: uint }
)

(define-read-only (get-reward-rate)
  (var-get base-reward-rate)
)

(define-read-only (get-bike-bonus)
  (var-get bike-bonus)
)

(define-read-only (get-multiplier (vehicle-type (string-ascii 20)))
  (default-to u100 (get multiplier (map-get? reward-multipliers { vehicle-type: vehicle-type })))
)

(define-read-only (get-emission-factor (vehicle-type (string-ascii 20)))
  (default-to u0 (get co2-per-km (map-get? emission-factors { vehicle-type: vehicle-type })))
)

(define-read-only (get-ride-reward (ride-id uint))
  (map-get? ride-rewards { ride-id: ride-id })
)

(define-private (validate-distance (distance uint))
  (if (and (>= distance (var-get min-distance)) (<= distance (var-get max-distance)))
      (ok true)
      (err ERR-INVALID-DISTANCE))
)

(define-private (validate-vehicle-type (vehicle-type (string-ascii 20)))
  (if (or (is-eq vehicle-type "electric") (is-eq vehicle-type "bike") (is-eq vehicle-type "public"))
      (ok true)
      (err ERR-INVALID-VEHICLE-TYPE))
)

(define-private (validate-timestamp (timestamp uint))
  (if (>= timestamp block-height)
      (ok true)
      (err ERR-INVALID-TIMESTAMP))
)

(define-private (validate-multiplier (multiplier uint))
  (if (and (> multiplier u0) (<= multiplier u1000))
      (ok true)
      (err ERR-INVALID-MULTIPLIER))
)

(define-private (validate-reward-rate (rate uint))
  (if (> rate u0)
      (ok true)
      (err ERR-INVALID-REWARD-RATE))
)

(define-private (validate-emission-factor (factor uint))
  (if (> factor u0)
      (ok true)
      (err ERR-INVALID-EMISSION-FACTOR))
)

(define-public (set-token-contract (contract principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR-NOT-AUTHORIZED))
    (asserts! (not (is-eq contract 'SP000000000000000000002Q6VF78)) (err ERR-NOT-AUTHORIZED))
    (var-set token-contract contract)
    (ok true)
  )
)

(define-public (set-verification-contract (contract principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR-NOT-AUTHORIZED))
    (asserts! (not (is-eq contract 'SP000000000000000000002Q6VF78)) (err ERR-NOT-AUTHORIZED))
    (var-set verification-contract contract)
    (ok true)
  )
)

(define-public (set-base-reward-rate (rate uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR-NOT-AUTHORIZED))
    (try! (validate-reward-rate rate))
    (var-set base-reward-rate rate)
    (ok true)
  )
)

(define-public (set-bike-bonus (bonus uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR-NOT-AUTHORIZED))
    (try! (validate-reward-rate bonus))
    (var-set bike-bonus bonus)
    (ok true)
  )
)

(define-public (set-multiplier (vehicle-type (string-ascii 20)) (multiplier uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR-NOT-AUTHORIZED))
    (try! (validate-vehicle-type vehicle-type))
    (try! (validate-multiplier multiplier))
    (map-set reward-multipliers { vehicle-type: vehicle-type } { multiplier: multiplier })
    (ok true)
  )
)

(define-public (set-emission-factor (vehicle-type (string-ascii 20)) (factor uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR-NOT-AUTHORIZED))
    (try! (validate-vehicle-type vehicle-type))
    (try! (validate-emission-factor factor))
    (map-set emission-factors { vehicle-type: vehicle-type } { co2-per-km: factor })
    (ok true)
  )
)

(define-public (calculate-reward (ride-id uint) (user principal) (distance uint) (vehicle-type (string-ascii 20)) (timestamp uint))
  (let (
        (multiplier (get-multiplier vehicle-type))
        (base-rate (var-get base-reward-rate))
        (bonus (if (is-eq vehicle-type "bike") (var-get bike-bonus) u0))
        (reward-amount (+ (* distance base-rate multiplier) bonus))
        (emission-factor (get-emission-factor vehicle-type))
        (emission-saved (* distance emission-factor))
      )
    (asserts! (not (is-eq (var-get verification-contract) 'SP000000000000000000002Q6VF78)) (err ERR-AUTHORITY-NOT-SET))
    (try! (validate-distance distance))
    (try! (validate-vehicle-type vehicle-type))
    (try! (validate-timestamp timestamp))
    (asserts! (is-some (map-get? ride-rewards { ride-id: ride-id })) (err ERR-RIDE-NOT-VERIFIED))
    (map-set ride-rewards
      { ride-id: ride-id }
      {
        user: user,
        distance: distance,
        vehicle-type: vehicle-type,
        reward-amount: reward-amount,
        timestamp: timestamp,
        emission-saved: emission-saved
      }
    )
    (try! (contract-call? (var-get token-contract) mint reward-amount user))
    (print { event: "reward-calculated", ride-id: ride-id, user: user, reward: reward-amount })
    (ok reward-amount)
  )
)

(define-public (get-total-emissions-saved (ride-id uint))
  (match (map-get? ride-rewards { ride-id: ride-id })
    reward
      (ok (get emission-saved reward))
    (err ERR-INVALID-RIDE-ID)
  )
)