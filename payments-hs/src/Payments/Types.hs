{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE OverloadedStrings #-}

module Payments.Types
  ( Money (..),
    Customer (..),
    CreateIntentReq (..),
    CreateIntentRes (..),
    PaymentIntent (..),
    PaymentEvent (..),
    IntentStatus (..),
    CashfreeCreateOrderReq (..),
    CashfreeCustomer (..),
    CashfreeOrderMeta (..),
    CashfreeCreateOrderRes (..),
    CashfreeWebhookEvent (..),
    WebhookOrder (..),
    WebhookPayment (..),
  )
where

import Data.Aeson
import Data.Aeson.Types (Parser)
import Data.Text (Text)
import GHC.Generics (Generic)

data Money = Money
  { amount :: Double,
    currency :: Text
  }
  deriving (Eq, Show, Generic)

instance FromJSON Money
instance ToJSON Money

data Customer = Customer
  { customerId :: Text,
    customerPhone :: Text,
    customerEmail :: Maybe Text,
    customerName :: Maybe Text
  }
  deriving (Eq, Show, Generic)

instance FromJSON Customer
instance ToJSON Customer

data CreateIntentReq = CreateIntentReq
  { money :: Money,
    customer :: Customer,
    returnUrl :: Maybe Text,
    notifyUrl :: Maybe Text,
    orderId :: Maybe Text
  }
  deriving (Eq, Show, Generic)

instance FromJSON CreateIntentReq
instance ToJSON CreateIntentReq

data IntentStatus = Created | Active | Paid | Failed | Cancelled deriving (Eq, Show, Generic)

instance ToJSON IntentStatus where
  toJSON Created = String "CREATED"
  toJSON Active = String "ACTIVE"
  toJSON Paid = String "PAID"
  toJSON Failed = String "FAILED"
  toJSON Cancelled = String "CANCELLED"

instance FromJSON IntentStatus where
  parseJSON = withText "IntentStatus" $ \t ->
    case t of
      "CREATED" -> pure Created
      "ACTIVE" -> pure Active
      "PAID" -> pure Paid
      "FAILED" -> pure Failed
      "CANCELLED" -> pure Cancelled
      _ -> fail "Invalid status"

data PaymentIntent = PaymentIntent
  { intentId :: Text,
    userId :: Maybe Text,
    cfOrderId :: Text,
    paymentSessionId :: Text,
    status :: IntentStatus,
    createdAt :: Text,
    updatedAt :: Text,
    money_ :: Money
  }
  deriving (Eq, Show, Generic)

instance ToJSON PaymentIntent where
  toJSON p =
    object
      [ "intentId" .= intentId p,
        "userId" .= userId p,
        "orderId" .= cfOrderId p,
        "paymentSessionId" .= paymentSessionId p,
        "status" .= status p,
        "createdAt" .= createdAt p,
        "updatedAt" .= updatedAt p,
        "money" .= money_ p
      ]

data PaymentEvent = PaymentEvent
  { eventId :: Text,
    orderId :: Text,
    eventType :: Text,
    signatureOk :: Bool,
    payload :: Value,
    createdAt :: Text
  }
  deriving (Eq, Show, Generic)

instance ToJSON PaymentEvent where
  toJSON e =
    object
      [ "eventId" .= eventId e,
        "orderId" .= orderId e,
        "eventType" .= eventType e,
        "signatureOk" .= signatureOk e,
        "payload" .= payload e,
        "createdAt" .= createdAt e
      ]

data CreateIntentRes = CreateIntentRes
  { intent :: PaymentIntent,
    checkout :: Value
  }
  deriving (Eq, Show, Generic)

instance ToJSON CreateIntentRes where
  toJSON r =
    object
      [ "intent" .= intent r,
        "checkout" .= checkout r
      ]

data CashfreeCustomer = CashfreeCustomer
  { cfCustomerId :: Text,
    cfCustomerPhone :: Text,
    cfCustomerEmail :: Maybe Text,
    cfCustomerName :: Maybe Text
  }
  deriving (Eq, Show, Generic)

instance ToJSON CashfreeCustomer where
  toJSON c =
    object
      [ "customer_id" .= cfCustomerId c,
        "customer_phone" .= cfCustomerPhone c,
        "customer_email" .= cfCustomerEmail c,
        "customer_name" .= cfCustomerName c
      ]

data CashfreeOrderMeta = CashfreeOrderMeta
  { cfReturnUrl :: Maybe Text,
    cfNotifyUrl :: Maybe Text
  }
  deriving (Eq, Show, Generic)

instance ToJSON CashfreeOrderMeta where
  toJSON m =
    object
      [ "return_url" .= cfReturnUrl m,
        "notify_url" .= cfNotifyUrl m
      ]

data CashfreeCreateOrderReq = CashfreeCreateOrderReq
  { cfOrderAmount :: Double,
    cfOrderCurrency :: Text,
    cfOrderId :: Text,
    cfCustomerDetails :: CashfreeCustomer,
    cfOrderMeta :: CashfreeOrderMeta
  }
  deriving (Eq, Show, Generic)

instance ToJSON CashfreeCreateOrderReq where
  toJSON r =
    object
      [ "order_amount" .= cfOrderAmount r,
        "order_currency" .= cfOrderCurrency r,
        "order_id" .= cfOrderId r,
        "customer_details" .= cfCustomerDetails r,
        "order_meta" .= cfOrderMeta r
      ]

data CashfreeCreateOrderRes = CashfreeCreateOrderRes
  { cfRespOrderId :: Text,
    cfRespPaymentSessionId :: Text
  }
  deriving (Eq, Show, Generic)

instance FromJSON CashfreeCreateOrderRes where
  parseJSON = withObject "CashfreeCreateOrderRes" $ \o ->
    CashfreeCreateOrderRes
      <$> o .: "order_id"
      <*> o .: "payment_session_id"

data WebhookOrder = WebhookOrder {whOrderId :: Text} deriving (Eq, Show, Generic)
data WebhookPayment = WebhookPayment {whPaymentStatus :: Text} deriving (Eq, Show, Generic)

instance FromJSON WebhookOrder where
  parseJSON = withObject "WebhookOrder" $ \o -> WebhookOrder <$> o .: "order_id"

instance FromJSON WebhookPayment where
  parseJSON = withObject "WebhookPayment" $ \o -> WebhookPayment <$> o .: "payment_status"

data CashfreeWebhookEvent = CashfreeWebhookEvent
  { whType :: Text,
    whOrder :: WebhookOrder,
    whPayment :: WebhookPayment
  }
  deriving (Eq, Show, Generic)

instance FromJSON CashfreeWebhookEvent where
  parseJSON = withObject "CashfreeWebhookEvent" $ \o -> do
    t <- o .: "type"
    d <- o .: "data"
    ord <- d .: "order"
    pay <- d .: "payment"
    CashfreeWebhookEvent t <$> parseJSON ord <*> parseJSON pay
