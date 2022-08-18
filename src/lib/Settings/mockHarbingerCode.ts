export default `{ parameter
    (or (pair %get
           string
           (contract
              (pair (string %currency_pair) (pair (timestamp %last_update) (nat %exchange_rate)))))
        (pair %update
           (string %currency_pair)
           (pair (timestamp %last_update) (nat %exchange_rate)))) ;
  storage (big_map string (pair timestamp nat)) ;
  code { UNPAIR ;
         IF_LEFT
           { SWAP ;
             DUP ;
             DUG 2 ;
             SWAP ;
             DUP ;
             DUG 2 ;
             CAR ;
             GET ;
             IF_NONE { PUSH string "NO_CURRENCY_PAIR_FOUND" ; FAILWITH } {} ;
             SWAP ;
             DUP ;
             DUG 2 ;
             CDR ;
             PUSH mutez 0 ;
             DUP 3 ;
             CDR ;
             DIG 3 ;
             CAR ;
             DIG 4 ;
             CAR ;
             PAIR 3 ;
             TRANSFER_TOKENS ;
             SWAP ;
             NIL operation ;
             DIG 2 ;
             CONS ;
             PAIR }
           { DUP ;
             DUG 2 ;
             GET 4 ;
             DUP 3 ;
             GET 3 ;
             PAIR ;
             SOME ;
             DIG 2 ;
             CAR ;
             UPDATE ;
             NIL operation ;
             PAIR } } ;
  view "getPrice"
       string
       (pair timestamp nat)
       { UNPAIR ; GET ; IF_NONE { PUSH string "bad_request" ; FAILWITH } {} } }`;
