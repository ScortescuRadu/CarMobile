//
//  CoolMapViewManager.swift
//  CarMobile
//
//  Created by Radu Scortescu on 13.02.2024.
//

import Foundation

@objc(MapViewManager)
class MapViewManager: RCTViewManager {
  override func view() -> UIView! {
    return MapView()
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}

