//
//  CoolMapView.swift
//  CarMobile
//
//  Created by Radu Scortescu on 13.02.2024.
//

import Foundation
import UIKit
import MapboxMaps
import MapboxDirections
import MapboxNavigation
import MapboxCoreNavigation

@objc(MapView)
class MapView: UIView{
  var mapView: NavigationMapView!
  
  override init(frame: CGRect) {
          super.init(frame: frame)
          setupMapView()
      }

      required init?(coder: NSCoder) {
          super.init(coder: coder)
          setupMapView()
      }

      private func setupMapView() {
          mapView = NavigationMapView(frame: bounds)
          mapView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
          addSubview(mapView)
        
        let origin = Waypoint(coordinate: CLLocationCoordinate2D(latitude: 38.9131752, longitude: -77.0324047), name: "Mapbox")
        let destination = Waypoint(coordinate: CLLocationCoordinate2D(latitude: 38.8977, longitude: -77.0365), name: "White House")
        let routeOptions = NavigationRouteOptions(waypoints: [origin, destination])
        
        Directions.shared.calculate(routeOptions) { session, result in
          switch result {
            case.failure(let error):
              print(error)
            case.success(let response):
            self.mapView.showcase(response.routes ?? [])
          }
        }
        
      }
  
//  override func viewDidLoad() {
//    super.viewDidLoad()
//
//    mapView = MapView(frame: view.bounds)
//    mapView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
//    self.view.addSubview(mapView)
//  }
  
}

