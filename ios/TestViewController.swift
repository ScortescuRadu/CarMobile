//
//  TestViewController.swift
//  CarMobile
//
//  Created by Radu Scortescu on 14.02.2024.
//

import Foundation
import UIKit
import MapboxMaps
import MapboxDirections
import MapboxNavigation
import MapboxCoreNavigation
//import MapboxSearchUI

class TestViewController: UIViewController {
  var mapView: NavigationMapView!
  
  override func viewDidLoad() {
    super.viewDidLoad()
    
    mapView = NavigationMapView(frame: view.bounds)
    mapView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    self.view.addSubview(mapView)
    
    let origin = Waypoint(coordinate: CLLocationCoordinate2D(latitude: 38.9131752, longitude: -77.0324047), name: "Mapbox")
    let destination = Waypoint(coordinate: CLLocationCoordinate2D(latitude: 38.8977, longitude: -77.0365), name: "White House")
    let routeOptions = NavigationRouteOptions(waypoints: [origin, destination])
    
    Directions.shared.calculate(routeOptions) { session, result in
      switch result {
      case.failure(let error):
        print(error)
      case.success(let response):
        print(response)
        self.mapView.showcase(response.routes ?? [])
        
        let navigationViewController = NavigationViewController(for: response, routeIndex: 0,
                                                                routeOptions: routeOptions)
        self.present(navigationViewController, animated: true)
      }
    }
  }
}
