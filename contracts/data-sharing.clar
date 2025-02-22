;; Data Sharing Contract

(define-data-var next-dataset-id uint u0)

(define-map datasets
  { dataset-id: uint }
  {
    owner: principal,
    experiment-id: uint,
    title: (string-ascii 100),
    data-hash: (buff 32)
  }
)

(define-public (share-dataset (experiment-id uint) (title (string-ascii 100)) (data-hash (buff 32)))
  (let
    ((dataset-id (+ (var-get next-dataset-id) u1)))
    (var-set next-dataset-id dataset-id)
    (ok (map-set datasets
      { dataset-id: dataset-id }
      {
        owner: tx-sender,
        experiment-id: experiment-id,
        title: title,
        data-hash: data-hash
      }
    ))
  )
)

(define-read-only (get-dataset (dataset-id uint))
  (map-get? datasets { dataset-id: dataset-id })
)

