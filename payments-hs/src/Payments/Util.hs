{-# LANGUAGE OverloadedStrings #-}

module Payments.Util
  ( newIntentId,
    nowIso,
    headerText,
  )
where

import Data.ByteString (ByteString)
import qualified Data.ByteString.Char8 as BS
import Data.Text (Text)
import qualified Data.Text as T
import qualified Data.Text.Encoding as TE
import Data.Time (getCurrentTime)
import Data.Time.Format (defaultTimeLocale, formatTime)
import Data.UUID (toText)
import Data.UUID.V4 (nextRandom)
import Network.HTTP.Types (HeaderName, RequestHeaders)

newIntentId :: IO Text
newIntentId = do
  u <- nextRandom
  pure ("pi_" <> toText u)

nowIso :: IO Text
nowIso = do
  t <- getCurrentTime
  pure (T.pack (formatTime defaultTimeLocale "%Y-%m-%dT%H:%M:%SZ" t))

headerText :: HeaderName -> RequestHeaders -> Maybe Text
headerText name headers = do
  v <- lookup name headers
  pure (TE.decodeUtf8 v)

