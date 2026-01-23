import UIKit
import Capacitor

/// Custom CAPBridgeViewController that registers local plugins
class MyViewController: CAPBridgeViewController {
    
    override func capacitorDidLoad() {
        // Register NativeTTS plugin with the bridge
        bridge?.registerPluginInstance(NativeTTSPlugin())
        print("[MyViewController] NativeTTSPlugin registered with Capacitor bridge")
    }
}
