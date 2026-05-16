module Main (main) where

import Control.Concurrent (forkIO)
import Payments.Config
import Payments.DB
import Payments.Reconcile
import Payments.Server

main :: IO ()
main = do
  cfg <- loadConfig
  withDb (dbPath cfg) $ \db -> do
    migrate db
    _ <- forkIO (reconcileLoop cfg db)
    runServer cfg db
