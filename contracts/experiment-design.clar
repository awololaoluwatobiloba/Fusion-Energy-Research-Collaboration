;; Experiment Design Contract

(define-data-var next-experiment-id uint u0)

(define-map experiments
  { experiment-id: uint }
  {
    lead-researcher: principal,
    title: (string-ascii 100),
    description: (string-utf8 500),
    status: (string-ascii 20)
  }
)

(define-public (create-experiment (title (string-ascii 100)) (description (string-utf8 500)))
  (let
    ((experiment-id (+ (var-get next-experiment-id) u1)))
    (var-set next-experiment-id experiment-id)
    (ok (map-set experiments
      { experiment-id: experiment-id }
      {
        lead-researcher: tx-sender,
        title: title,
        description: description,
        status: "proposed"
      }
    ))
  )
)

(define-public (update-experiment-status (experiment-id uint) (new-status (string-ascii 20)))
  (let
    ((experiment (unwrap! (map-get? experiments { experiment-id: experiment-id }) (err u404))))
    (asserts! (is-eq (get lead-researcher experiment) tx-sender) (err u403))
    (ok (map-set experiments
      { experiment-id: experiment-id }
      (merge experiment { status: new-status })
    ))
  )
)

(define-read-only (get-experiment (experiment-id uint))
  (map-get? experiments { experiment-id: experiment-id })
)

