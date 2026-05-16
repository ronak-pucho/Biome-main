{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE ScopedTypeVariables #-}

module Payments.Reconcile
  ( reconcileLoop,
  )
where

import Control.Concurrent (threadDelay)
import Control.Exception (SomeException, catch)
import Control.Monad (forM_)
import Data.Aeson (Value (..))
import qualified Data.Aeson.Key as K
import qualified Data.Aeson.KeyMap as KM
import Data.Text (Text)
import Payments.Cashfree
import Payments.Config
import Payments.DB
import Payments.Types
import Payments.Util

reconcileLoop :: Config -> Db -> IO ()
reconcileLoop cfg db = loop
  where
    loop = do
      reconcileOnce `catch` (\(_ :: SomeException) -> pure ())
      threadDelay (120 * 1000 * 1000)
      loop

    reconcileOnce = do
      items <- listOpenIntents db 50
      forM_ items $ \(_intentId, orderId) -> do
        v <- fetchOrder cfg orderId `catch` (\(_ :: SomeException) -> pure Null)
        case extractOrderStatus v of
          Just "PAID" -> set Paid
          Just "EXPIRED" -> set Cancelled
          Just "ACTIVE" -> pure ()
          _ -> pure ()
        where
          set st = do
            now <- nowIso
            updateIntentStatus db orderId st now

extractOrderStatus :: Value -> Maybe Text
extractOrderStatus v =
  case v of
    Object o ->
      case KM.lookup (K.fromText "order_status") o of
        Just (String s) -> Just s
        _ -> Nothing
    _ -> Nothing
