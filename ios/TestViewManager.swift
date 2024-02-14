//
//  TestViewManager.swift
//  CarMobile
//
//  Created by Radu Scortescu on 14.02.2024.
//

import Foundation

@objc(TestViewManager)
class TestViewManager: RCTViewManager {
  override func view() -> UIView! {
    let label = UILabel()
    label.text = "Hey there!"
    label.textAlignment = .center
    return label
  }
  
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
