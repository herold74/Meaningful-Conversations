import Foundation
import Capacitor
import Speech
import AVFoundation

@objc(NativeSTTPlugin)
public class NativeSTTPlugin: CAPPlugin, CAPBridgedPlugin {
    
    // MARK: - CAPBridgedPlugin Protocol
    public let identifier = "NativeSTTPlugin"
    public let jsName = "NativeSTT"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermission", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "transcribeFile", returnType: CAPPluginReturnPromise)
    ]
    
    // MARK: - Properties
    private var speechRecognizer: SFSpeechRecognizer?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private var audioEngine: AVAudioEngine?
    private var isRecording = false
    
    // MARK: - Plugin Methods
    
    @objc func isAvailable(_ call: CAPPluginCall) {
        let available = SFSpeechRecognizer.authorizationStatus() != .restricted
        call.resolve(["available": available])
    }
    
    @objc func requestPermission(_ call: CAPPluginCall) {
        SFSpeechRecognizer.requestAuthorization { status in
            switch status {
            case .authorized:
                // Also request microphone permission
                NativeSTTPlugin.requestMicrophonePermission { granted in
                    call.resolve(["granted": granted && status == .authorized])
                }
            case .denied, .restricted, .notDetermined:
                call.resolve(["granted": false])
            @unknown default:
                call.resolve(["granted": false])
            }
        }
    }
    
    @objc func start(_ call: CAPPluginCall) {
        let language = call.getString("language") ?? "en-US"
        
        print("[NativeSTT] start() called with language: \(language)")
        
        // Stop any existing recognition without firing stopped event (cleanup for new session)
        stopRecognition(notify: false)
        
        // Check authorization
        let authStatus = SFSpeechRecognizer.authorizationStatus()
        guard authStatus == .authorized else {
            print("[NativeSTT] Not authorized (status: \(authStatus.rawValue)), requesting permission...")
            
            SFSpeechRecognizer.requestAuthorization { [weak self] status in
                if status == .authorized {
                    // Also need mic permission
                    NativeSTTPlugin.requestMicrophonePermission { granted in
                        if granted {
                            self?.startRecognition(language: language, call: call)
                        } else {
                            print("[NativeSTT] Microphone permission denied")
                            call.reject("Microphone permission denied")
                        }
                    }
                } else {
                    print("[NativeSTT] Speech recognition permission denied")
                    call.reject("Speech recognition permission denied")
                }
            }
            return
        }
        
        // Check mic permission
        guard NativeSTTPlugin.microphonePermissionGranted else {
            print("[NativeSTT] Microphone not granted, requesting...")
            NativeSTTPlugin.requestMicrophonePermission { [weak self] granted in
                if granted {
                    self?.startRecognition(language: language, call: call)
                } else {
                    print("[NativeSTT] Microphone permission denied")
                    call.reject("Microphone permission denied")
                }
            }
            return
        }
        
        startRecognition(language: language, call: call)
    }
    
    @objc func stop(_ call: CAPPluginCall) {
        print("[NativeSTT] stop() called")
        stopRecognition()
        call.resolve()
    }

    /// On-device transcription of a recording. Used when the cloud transcribe call cannot run.
    @objc func transcribeFile(_ call: CAPPluginCall) {
        let rawPath = call.getString("path") ?? ""
        let language = call.getString("language") ?? "de-DE"
        let url: URL
        if rawPath.hasPrefix("file:") {
            guard let parsed = URL(string: rawPath) else {
                call.reject("Invalid audio path")
                return
            }
            url = parsed
        } else {
            url = URL(fileURLWithPath: rawPath)
        }

        SFSpeechRecognizer.requestAuthorization { status in
            guard status == .authorized else {
                call.reject("Speech recognition permission denied")
                return
            }
            guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: language)), recognizer.isAvailable else {
                call.reject("On-device speech recognition is unavailable")
                return
            }
            guard recognizer.supportsOnDeviceRecognition else {
                call.reject("On-device speech recognition is unavailable for this language")
                return
            }
            let request = SFSpeechURLRecognitionRequest(url: url)
            request.requiresOnDeviceRecognition = true
            request.shouldReportPartialResults = true
            let lock = NSLock()
            var settled = false
            recognizer.recognitionTask(with: request) { result, error in
                lock.lock()
                defer { lock.unlock() }
                if settled { return }
                if let result, result.isFinal {
                    settled = true
                    call.resolve(["text": result.bestTranscription.formattedString])
                    return
                }
                if error != nil && result == nil {
                    settled = true
                    call.reject("On-device transcription failed")
                }
            }
        }
    }
    
    // MARK: - Microphone Permission Helpers (iOS 17+ / legacy)

    /// Wraps AVAudioApplication (iOS 17+) / AVAudioSession (< iOS 17) mic permission request
    /// to avoid deprecation warnings while still supporting the app's iOS 15 deployment target.
    private static func requestMicrophonePermission(completion: @escaping (Bool) -> Void) {
        if #available(iOS 17.0, *) {
            AVAudioApplication.requestRecordPermission { granted in
                completion(granted)
            }
        } else {
            AVAudioSession.sharedInstance().requestRecordPermission { granted in
                completion(granted)
            }
        }
    }

    /// Wraps AVAudioApplication (iOS 17+) / AVAudioSession (< iOS 17) mic permission status
    /// to avoid deprecation warnings while still supporting the app's iOS 15 deployment target.
    private static var microphonePermissionGranted: Bool {
        if #available(iOS 17.0, *) {
            return AVAudioApplication.shared.recordPermission == .granted
        } else {
            return AVAudioSession.sharedInstance().recordPermission == .granted
        }
    }

    // MARK: - Private Methods
    
    private func startRecognition(language: String, call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: language)) else {
                print("[NativeSTT] Speech recognizer not available for language: \(language)")
                call.reject("Speech recognizer not available for \(language)")
                return
            }

            guard recognizer.isAvailable else {
                print("[NativeSTT] Speech recognizer not currently available")
                call.reject("Speech recognizer not currently available")
                return
            }

            self.speechRecognizer = recognizer

            let audioSession = AVAudioSession.sharedInstance()
            do {
                try audioSession.setCategory(.record, mode: .measurement, options: [])
            } catch {
                print("[NativeSTT] ❌ Failed to set audio category: \(error)")
                call.reject("Failed to start speech recognition: \(error.localizedDescription)")
                return
            }

            MCAudioSession.activate(audioSession) { [weak self] success in
                guard let self = self else { return }
                guard success else {
                    print("[NativeSTT] ❌ Failed to activate audio session")
                    call.reject("Failed to start speech recognition: audio session activation failed")
                    return
                }

                print("[NativeSTT] Audio session configured for recording")
                print("[NativeSTT] Audio session category: \(audioSession.category.rawValue)")
                print("[NativeSTT] Audio session mode: \(audioSession.mode.rawValue)")

                do {
                    try self.runRecognitionEngine(recognizer: recognizer, call: call)
                } catch {
                    print("[NativeSTT] ❌ Failed to start recognition: \(error)")
                    self.stopRecognition()
                    call.reject("Failed to start speech recognition: \(error.localizedDescription)")
                }
            }
        }
    }

    private func runRecognitionEngine(recognizer: SFSpeechRecognizer, call: CAPPluginCall) throws {
        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = true

        if #available(iOS 13.0, *) {
            if recognizer.supportsOnDeviceRecognition {
                request.requiresOnDeviceRecognition = true
                print("[NativeSTT] Using on-device recognition")
            } else {
                print("[NativeSTT] On-device recognition is not available for this language")
                MCAudioSession.deactivate(AVAudioSession.sharedInstance(), notifyOthers: true) { }
                call.reject("On-device speech recognition is not available. Download the language in iOS Settings and try again.")
                return
            }
        }

        recognitionRequest = request

        let engine = AVAudioEngine()
        audioEngine = engine

        let inputNode = engine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)

        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { [weak self] buffer, _ in
            self?.recognitionRequest?.append(buffer)
        }

        recognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
            guard let self = self else { return }

            if let result = result {
                let transcript = result.bestTranscription.formattedString
                let isFinal = result.isFinal

                self.notifyListeners("partialResult", data: [
                    "transcript": transcript,
                    "isFinal": isFinal
                ])

                if isFinal {
                    print("[NativeSTT] Final result: \(transcript)")
                }
            }

            if let error = error {
                let nsError = error as NSError
                print("[NativeSTT] Recognition error: \(error.localizedDescription) (domain: \(nsError.domain), code: \(nsError.code))")
                self.notifyListeners("error", data: [
                    "message": error.localizedDescription
                ])
                self.stopRecognition(notify: true)
            }
        }

        engine.prepare()
        try engine.start()

        isRecording = true
        print("[NativeSTT] ✅ Recognition started successfully")
        notifyListeners("started", data: [:])
        call.resolve()
    }
    
    private func stopRecognition(notify: Bool = true) {
        let wasRecording = isRecording
        
        if wasRecording {
            print("[NativeSTT] Stopping recognition... (notify: \(notify))")
        }
        
        // Stop audio engine
        if let engine = audioEngine, engine.isRunning {
            engine.stop()
            engine.inputNode.removeTap(onBus: 0)
        }
        audioEngine = nil
        
        // End recognition request
        recognitionRequest?.endAudio()
        recognitionRequest = nil
        
        // Cancel recognition task
        recognitionTask?.cancel()
        recognitionTask = nil
        
        isRecording = false
        
        // Deactivate audio session to release it for TTS
        if wasRecording {
            MCAudioSession.deactivate(AVAudioSession.sharedInstance(), notifyOthers: true) {
                print("[NativeSTT] ✅ Audio session deactivated after STT stop")
            }
        }
        
        if notify && wasRecording {
            notifyListeners("stopped", data: [:])
        }
    }
}
