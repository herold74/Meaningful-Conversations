import AVFoundation

/// AVAudioSession activation that avoids main-thread hang warnings (iOS 27+) and legacy sync calls on older OS versions.
enum MCAudioSession {
    static func activate(_ session: AVAudioSession, completion: @escaping (Bool) -> Void) {
        if #available(iOS 27.0, *) {
            session.activate(options: []) { activated, error in
                let ok = activated && error == nil
                DispatchQueue.main.async { completion(ok) }
            }
            return
        }
        DispatchQueue.global(qos: .userInitiated).async {
            let ok: Bool
            do {
                try session.setActive(true, options: [])
                ok = true
            } catch {
                ok = false
            }
            DispatchQueue.main.async { completion(ok) }
        }
    }

    static func deactivate(_ session: AVAudioSession, notifyOthers: Bool = true, completion: (() -> Void)? = nil) {
        if #available(iOS 27.0, *) {
            let options: AVAudioSessionDeactivationOptions =
                notifyOthers ? .notifyOthersOnDeactivation : []
            session.deactivate(options: options) { _, _ in
                DispatchQueue.main.async { completion?() }
            }
            return
        }
        var options: AVAudioSession.SetActiveOptions = []
        if notifyOthers {
            options.insert(.notifyOthersOnDeactivation)
        }
        DispatchQueue.global(qos: .userInitiated).async {
            try? session.setActive(false, options: options)
            DispatchQueue.main.async { completion?() }
        }
    }
}
