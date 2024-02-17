//
//  TestViewManager.swift
//  CarMobile
//
//  Created by Radu Scortescu on 14.02.2024.
//

import Foundation
import React

@objc(TestViewManager)
class TestViewManager: RCTViewManager {
  override func view() -> UIView! {
          return TestView()
      }
  
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
