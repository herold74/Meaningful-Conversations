import Foundation
import Capacitor
import AVFoundation

@objc(NativeTTSPlugin)
public class NativeTTSPlugin: CAPPlugin, CAPBridgedPlugin, AVSpeechSynthesizerDelegate {
    
    // MARK: - CAPBridgedPlugin Protocol
    public let identifier = "NativeTTSPlugin"
    public let jsName = "NativeTTS"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getVoices", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "speak", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pause", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "resume", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isSpeaking", returnType: CAPPluginReturnPromise)
    ]
    
    // MARK: - Properties
    private var synthesizer: AVSpeechSynthesizer!
    private var currentCall: CAPPluginCall?
    
    // MARK: - Audio Session Management
    
    /// Deactivate audio session and notify other apps they can resume
    private func deactivateAudioSession(completion: (() -> Void)? = nil) {
        let session = AVAudioSession.sharedInstance()
        MCAudioSession.deactivate(session, notifyOthers: true) {
            print("[NativeTTS] Audio session deactivated")
            completion?()
        }
    }

    /// Configure audio session for high-quality TTS playback
    private func configureAudioSessionForPlayback(completion: @escaping () -> Void) {
        let session = AVAudioSession.sharedInstance()

        func activateForPlayback(categoryOptions: AVAudioSession.CategoryOptions, label: String) {
            do {
                if #available(iOS 12.0, *) {
                    try session.setCategory(.playback, mode: .spokenAudio, options: categoryOptions)
                } else {
                    try session.setCategory(.playback, mode: .default, options: categoryOptions)
                }
            } catch {
                print("[NativeTTS] Audio session configuration error: \(error)")
                completion()
                return
            }
            MCAudioSession.activate(session) { success in
                if success {
                    print("[NativeTTS] \(label) (mode: \(session.mode.rawValue))")
                } else {
                    print("[NativeTTS] Audio session activation failed")
                }
                completion()
            }
        }

        // CRITICAL: If other audio is playing (e.g., STT session not fully released),
        // we MUST wait for it to finish before we can configure our session
        if session.isOtherAudioPlaying {
            print("[NativeTTS] ⚠️ Other audio is playing - waiting for it to release...")

            var attempts = 0
            let maxAttempts = 10

            while session.isOtherAudioPlaying && attempts < maxAttempts {
                Thread.sleep(forTimeInterval: 0.1)
                attempts += 1
                print("[NativeTTS] Waiting for audio session release (attempt \(attempts)/\(maxAttempts))...")
            }

            if session.isOtherAudioPlaying {
                print("[NativeTTS] ⚠️ Other audio STILL playing after \(maxAttempts) attempts")
                print("[NativeTTS] Using .mixWithOthers fallback to allow degraded playback")
                activateForPlayback(categoryOptions: [.mixWithOthers], label: "Audio session configured with .mixWithOthers (degraded mode)")
                return
            }
            print("[NativeTTS] ✅ Audio session released after \(attempts) attempts")
        }

        MCAudioSession.deactivate(session, notifyOthers: true) {
            activateForPlayback(categoryOptions: [.duckOthers], label: "Audio session configured for playback")
        }
    }
    
    // MARK: - Lifecycle
    public override func load() {
        print("[NativeTTSPlugin] load() called - plugin is being initialized!")
        synthesizer = AVSpeechSynthesizer()
        synthesizer.delegate = self
        print("[NativeTTSPlugin] AVSpeechSynthesizer initialized, voices available: \(AVSpeechSynthesisVoice.speechVoices().count)")
    }
    
    // MARK: - Plugin Methods
    @objc func getVoices(_ call: CAPPluginCall) {
        print("[NativeTTSPlugin] getVoices called!")
        
        let voices = AVSpeechSynthesisVoice.speechVoices()
        var voiceData: [[String: Any]] = []
        
        for voice in voices {
            var quality = "default"
            if #available(iOS 13.0, *) {
                switch voice.quality {
                case .enhanced:
                    quality = "enhanced"
                case .premium:
                    quality = "premium"
                default:
                    quality = "default"
                }
            }
            
            // Extract clean name (remove language suffix if present)
            var cleanName = voice.name
            if let range = cleanName.range(of: " (", options: .backwards) {
                cleanName = String(cleanName[..<range.lowerBound])
            }
            
            voiceData.append([
                "identifier": voice.identifier,
                "name": cleanName,
                "fullName": voice.name,
                "language": voice.language,
                "quality": quality
            ])
        }
        
        print("[NativeTTSPlugin] Returning \(voiceData.count) voices")
        call.resolve(["voices": voiceData])
    }
    
    @objc func speak(_ call: CAPPluginCall) {
        guard let text = call.getString("text"), !text.isEmpty else {
            call.reject("Text is required")
            return
        }

        let utterance = AVSpeechUtterance(string: text)

        if let voiceIdentifier = call.getString("voiceIdentifier") {
            if let voice = AVSpeechSynthesisVoice(identifier: voiceIdentifier) {
                utterance.voice = voice
            } else {
                let languageCode = String(voiceIdentifier.prefix(5))
                utterance.voice = AVSpeechSynthesisVoice(language: languageCode)
            }
        }

        let rate = call.getFloat("rate") ?? 0.5
        utterance.rate = max(AVSpeechUtteranceMinimumSpeechRate, min(AVSpeechUtteranceMaximumSpeechRate, rate))

        let pitch = call.getFloat("pitch") ?? 1.0
        utterance.pitchMultiplier = max(0.5, min(2.0, pitch))

        let volume = call.getFloat("volume") ?? 1.0
        utterance.volume = max(0.0, min(1.0, volume))

        currentCall = call

        let startSpeaking = { [self] in
            self.configureAudioSessionForPlayback {
                self.synthesizer.speak(utterance)
            }
        }

        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
            deactivateAudioSession(completion: startSpeaking)
        } else {
            startSpeaking()
        }
    }
    
    @objc func stop(_ call: CAPPluginCall) {
        synthesizer.stopSpeaking(at: .immediate)
        deactivateAudioSession()  // Clean up audio session
        currentCall = nil
        call.resolve()
    }
    
    @objc func pause(_ call: CAPPluginCall) {
        synthesizer.pauseSpeaking(at: .word)
        call.resolve()
    }
    
    @objc func resume(_ call: CAPPluginCall) {
        synthesizer.continueSpeaking()
        call.resolve()
    }
    
    @objc func isSpeaking(_ call: CAPPluginCall) {
        call.resolve([
            "speaking": synthesizer.isSpeaking,
            "paused": synthesizer.isPaused
        ])
    }
    
    // MARK: - AVSpeechSynthesizerDelegate
    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didStart utterance: AVSpeechUtterance) {
        notifyListeners("speechStart", data: [:])
    }
    
    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        notifyListeners("speechEnd", data: [:])
        
        // Deactivate audio session
        deactivateAudioSession()
        
        // Resolve the pending call
        if let call = currentCall {
            call.resolve(["completed": true])
            currentCall = nil
        }
    }
    
    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        notifyListeners("speechCancel", data: [:])
        
        // Deactivate audio session when cancelled
        deactivateAudioSession()
        
        // Resolve the pending call
        if let call = currentCall {
            call.resolve(["completed": false, "cancelled": true])
            currentCall = nil
        }
    }
}
