//
//  TestView.swift
//  CarMobile
//
//  Created by Radu Scortescu on 14.02.2024.
//

import Foundation
import UIKit

@objc(TestView)
class TestView: UIView {

    var myUIViewController: TestViewController?

    override init(frame: CGRect) {
        super.init(frame: frame)
        setup()
    }

    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
        setup()
    }

    private func setup() {
        myUIViewController = TestViewController()
        myUIViewController?.view.frame = bounds
        addSubview(myUIViewController!.view)
    }
}
