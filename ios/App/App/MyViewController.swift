import UIKit
import Capacitor

/// Custom CAPBridgeViewController that registers local plugins
class MyViewController: CAPBridgeViewController {
    
    override func viewDidLoad() {
        super.viewDidLoad()
        NativeGamificationBarManager.shared.attach(to: self)
    }
    
    override func viewSafeAreaInsetsDidChange() {
        super.viewSafeAreaInsetsDidChange()
        NativeGamificationBarManager.shared.updateLayout()
    }
    
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        NativeGamificationBarManager.shared.updateLayout()
    }
    
    override func capacitorDidLoad() {
        // Register NativeTTS plugin with the bridge
        bridge?.registerPluginInstance(NativeTTSPlugin())
        bridge?.registerPluginInstance(NativeGamificationBarPlugin())
        NativeGamificationBarManager.shared.bridge = bridge
    }
}

// MARK: - Native Gamification Bar Overlay

final class NativeGamificationBarManager {
    static let shared = NativeGamificationBarManager()
    weak var bridge: CAPBridgeProtocol?
    private weak var barView: NativeGamificationBarView?
    private weak var hostView: UIView?
    private var barLeadingConstraint: NSLayoutConstraint?
    private var barTrailingConstraint: NSLayoutConstraint?
    
    private init() {}
    
    func attach(to viewController: CAPBridgeViewController) {
        guard barView == nil else { return }
        
        let bar = NativeGamificationBarView()
        bar.translatesAutoresizingMaskIntoConstraints = false
        bar.onAction = { [weak self] action in
            self?.sendActionToWeb(action: action)
        }
        
        viewController.view.addSubview(bar)
        viewController.view.bringSubviewToFront(bar)
        
        let heightConstraint = bar.heightAnchor.constraint(equalToConstant: 120)
        bar.heightConstraint = heightConstraint
        bar.contentTopConstraint = bar.contentTopAnchor.constraint(equalTo: bar.topAnchor, constant: 0)
        
        barLeadingConstraint = bar.leadingAnchor.constraint(equalTo: viewController.view.leadingAnchor)
        barTrailingConstraint = bar.trailingAnchor.constraint(equalTo: viewController.view.trailingAnchor)

        NSLayoutConstraint.activate([
            bar.topAnchor.constraint(equalTo: viewController.view.topAnchor),
            barLeadingConstraint!,
            barTrailingConstraint!,
            heightConstraint
        ])
        
        bar.contentTopConstraint?.isActive = true
        
        self.barView = bar
        self.hostView = viewController.view
        
        updateLayout()
    }
    
    func updateLayout() {
        guard let hostView = hostView, let barView = barView else { return }
        let safeTop = hostView.safeAreaInsets.top
        let isLandscape = hostView.bounds.width > hostView.bounds.height && hostView.bounds.height > 0
        let sideInset: CGFloat = 0
        barLeadingConstraint?.constant = sideInset
        barTrailingConstraint?.constant = -sideInset
        barView.updateLayout(safeTop: safeTop, isLandscape: isLandscape)
        hostView.bringSubviewToFront(barView)
    }
    
    func updateState(_ state: NativeGamificationBarState) {
        barView?.applyState(state)
        barView?.isHidden = !state.visible
        updateLayout()
    }
    
    private func sendActionToWeb(action: String) {
        let allowed = ["menu", "achievements", "theme", "colorTheme"]
        guard allowed.contains(action) else { return }
        bridge?.eval(js: "window.nativeGamificationBarAction && window.nativeGamificationBarAction('\(action)')")
    }
}

struct NativeGamificationBarState {
    let visible: Bool
    let minimal: Bool
    let view: String
    let activeView: String
    let menuView: String?
    let colorTheme: String
    let levelText: String
    let streakText: String
    let xpText: String
    let progress: Float
    let isMenuOpen: Bool
    let isDarkMode: Bool
}

final class NativeGamificationBarView: UIView {
    private let blurView: UIVisualEffectView = {
        let blur = UIBlurEffect(style: .systemUltraThinMaterial)
        return UIVisualEffectView(effect: blur)
    }()
    private let tintOverlay = UIView()  // Colored overlay on top of blur
    private let contentStack = UIStackView()
    private let leftStack = UIStackView()
    private let centerStack = UIStackView()
    private let rightStack = UIStackView()
    private let leftSpacer = UIView()
    private let rightSpacer = UIView()
    
    private let menuButton = UIButton(type: .system)
    private let levelLabel = UILabel()
    private let streakLabel = UILabel()
    private let xpLabel = UILabel()
    private let progressView = UIProgressView(progressViewStyle: .default)
    private let achievementsButton = UIButton(type: .system)
    private let themeButton = UIButton(type: .system)
    private let paletteButton = UIButton(type: .system)
    
    var onAction: ((String) -> Void)?
    var heightConstraint: NSLayoutConstraint?
    var contentTopConstraint: NSLayoutConstraint?
    private var contentLeadingConstraint: NSLayoutConstraint?
    private var contentTrailingConstraint: NSLayoutConstraint?
    private var contentBottomConstraint: NSLayoutConstraint?
    private var progressWidthConstraint: NSLayoutConstraint?
    private var rightStackWidthConstraint: NSLayoutConstraint?
    private var centerStackWidthConstraint: NSLayoutConstraint?
    private var leftStackWidthConstraint: NSLayoutConstraint?
    private var barLeadingConstraint: NSLayoutConstraint?
    private var barTrailingConstraint: NSLayoutConstraint?
    var contentTopAnchor: NSLayoutAnchor<NSLayoutYAxisAnchor> { contentStack.topAnchor }
    
    private var isMinimal = false
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupView()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupView()
    }
    
    private func setupView() {
        backgroundColor = .clear
        
        // Blur effect background
        blurView.translatesAutoresizingMaskIntoConstraints = false
        addSubview(blurView)
        
        // Tinted overlay on top of blur
        tintOverlay.translatesAutoresizingMaskIntoConstraints = false
        addSubview(tintOverlay)
        
        contentStack.axis = .horizontal
        contentStack.alignment = .center
        contentStack.distribution = .fill
        contentStack.spacing = 2
        contentStack.translatesAutoresizingMaskIntoConstraints = false
        
        leftStack.axis = .horizontal
        leftStack.alignment = .center
        leftStack.spacing = 6
        
        centerStack.axis = .vertical
        centerStack.alignment = .center
        centerStack.spacing = 4
        
        rightStack.axis = .horizontal
        rightStack.alignment = .center
        rightStack.distribution = .fill
        rightStack.spacing = 20
        
        leftSpacer.translatesAutoresizingMaskIntoConstraints = false
        rightSpacer.translatesAutoresizingMaskIntoConstraints = false
        
        menuButton.setImage(UIImage(systemName: "line.3.horizontal"), for: .normal)
        menuButton.addTarget(self, action: #selector(handleMenuTap), for: .touchUpInside)
        
        achievementsButton.setImage(UIImage(systemName: "trophy"), for: .normal)
        achievementsButton.addTarget(self, action: #selector(handleAchievementsTap), for: .touchUpInside)
        
        themeButton.setImage(UIImage(systemName: "moon"), for: .normal)
        themeButton.addTarget(self, action: #selector(handleThemeTap), for: .touchUpInside)
        
        paletteButton.setImage(UIImage(systemName: "paintpalette"), for: .normal)
        paletteButton.addTarget(self, action: #selector(handlePaletteTap), for: .touchUpInside)
        
        levelLabel.font = UIFont.systemFont(ofSize: 12, weight: .medium)
        streakLabel.font = UIFont.systemFont(ofSize: 12, weight: .medium)
        xpLabel.font = UIFont.monospacedSystemFont(ofSize: 11, weight: .regular)
        levelLabel.textColor = UIColor.label
        streakLabel.textColor = UIColor.label
        xpLabel.textColor = UIColor.secondaryLabel
        
        progressView.progressTintColor = UIColor.systemGreen
        progressView.trackTintColor = UIColor.systemGray4
        let iconTint = UIColor.secondaryLabel
        menuButton.tintColor = iconTint
        achievementsButton.tintColor = iconTint
        themeButton.tintColor = iconTint
        paletteButton.tintColor = iconTint
        let progressWidth = progressView.widthAnchor.constraint(lessThanOrEqualToConstant: 120)
        progressWidth.priority = UILayoutPriority(750)
        progressWidth.isActive = true
        progressWidthConstraint = progressWidth
        progressView.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
        xpLabel.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
        levelLabel.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
        streakLabel.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
        centerStack.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
        rightStack.setContentCompressionResistancePriority(.required, for: .horizontal)
        rightStack.setContentHuggingPriority(.required, for: .horizontal)
        leftStack.setContentCompressionResistancePriority(.required, for: .horizontal)
        leftStack.setContentHuggingPriority(.required, for: .horizontal)
        centerStack.setContentHuggingPriority(.defaultLow, for: .horizontal)
        leftSpacer.setContentHuggingPriority(.defaultLow, for: .horizontal)
        rightSpacer.setContentHuggingPriority(.defaultLow, for: .horizontal)
        
        leftStack.addArrangedSubview(menuButton)
        leftStack.addArrangedSubview(levelLabel)
        leftStack.addArrangedSubview(streakLabel)
        
        centerStack.addArrangedSubview(progressView)
        centerStack.addArrangedSubview(xpLabel)
        
        rightStack.addArrangedSubview(achievementsButton)
        rightStack.addArrangedSubview(themeButton)
        rightStack.addArrangedSubview(paletteButton)
        
        contentStack.addArrangedSubview(leftStack)
        contentStack.addArrangedSubview(leftSpacer)
        contentStack.addArrangedSubview(centerStack)
        contentStack.addArrangedSubview(rightSpacer)
        contentStack.addArrangedSubview(rightStack)
        contentStack.setCustomSpacing(12, after: leftStack)
        contentStack.setCustomSpacing(12, after: centerStack)
        
        addSubview(contentStack)
        
        NSLayoutConstraint.activate([
            blurView.topAnchor.constraint(equalTo: topAnchor),
            blurView.leadingAnchor.constraint(equalTo: leadingAnchor),
            blurView.trailingAnchor.constraint(equalTo: trailingAnchor),
            blurView.bottomAnchor.constraint(equalTo: bottomAnchor),
            
            tintOverlay.topAnchor.constraint(equalTo: topAnchor),
            tintOverlay.leadingAnchor.constraint(equalTo: leadingAnchor),
            tintOverlay.trailingAnchor.constraint(equalTo: trailingAnchor),
            tintOverlay.bottomAnchor.constraint(equalTo: bottomAnchor),
        ])
        
        contentLeadingConstraint = contentStack.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 12)
        contentTrailingConstraint = contentStack.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -12)
        contentBottomConstraint = contentStack.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -2)
        let rightWidth = rightStack.widthAnchor.constraint(equalToConstant: 120)
        rightWidth.priority = UILayoutPriority(900)
        rightWidth.isActive = true
        rightStackWidthConstraint = rightWidth
        let leftWidth = leftStack.widthAnchor.constraint(equalToConstant: 160)
        leftWidth.priority = UILayoutPriority(900)
        leftWidth.isActive = true
        leftStackWidthConstraint = leftWidth
        let spacerWidth = leftSpacer.widthAnchor.constraint(equalTo: rightSpacer.widthAnchor)
        spacerWidth.priority = UILayoutPriority(999)
        spacerWidth.isActive = true
        let centerWidth = centerStack.widthAnchor.constraint(equalToConstant: 160)
        centerWidth.priority = UILayoutPriority(900)
        centerWidth.isActive = true
        centerStackWidthConstraint = centerWidth
    }
    
    func updateLayout(safeTop: CGFloat, isLandscape: Bool) {
        let barHeight: CGFloat = isMinimal ? 48 : 60
        heightConstraint?.constant = safeTop + barHeight
        let topInset = max(safeTop - 12, 0)
        contentTopConstraint?.constant = topInset
        
        centerStack.axis = isLandscape ? .horizontal : .vertical
        centerStack.spacing = isLandscape ? 8 : 4
        progressWidthConstraint?.constant = isLandscape ? 140 : 120
        centerStackWidthConstraint?.constant = isLandscape ? 180 : 160
        
        let hasWidth = bounds.width > 1
        if hasWidth {
            if contentLeadingConstraint?.isActive != true {
                contentLeadingConstraint?.isActive = true
                contentTrailingConstraint?.isActive = true
                contentBottomConstraint?.isActive = true
            }
        } else {
            if contentLeadingConstraint?.isActive == true {
                contentLeadingConstraint?.isActive = false
                contentTrailingConstraint?.isActive = false
                contentBottomConstraint?.isActive = false
            }
        }
        layoutIfNeeded()
    }
    
    func applyState(_ state: NativeGamificationBarState) {
        isMinimal = state.minimal
        levelLabel.text = state.levelText
        streakLabel.text = state.streakText
        xpLabel.text = state.xpText
        progressView.progress = state.progress

        let palette = themePalette(for: state.colorTheme, isDarkMode: state.isDarkMode)
        tintOverlay.backgroundColor = palette.accent.withAlphaComponent(palette.backgroundAlpha)
        progressView.progressTintColor = palette.accent
        progressView.trackTintColor = palette.secondaryText.withAlphaComponent(palette.trackAlpha)
        levelLabel.textColor = palette.primaryText
        streakLabel.textColor = palette.primaryText
        xpLabel.textColor = palette.secondaryText
        menuButton.tintColor = palette.secondaryText
        achievementsButton.tintColor = palette.secondaryText
        themeButton.tintColor = palette.secondaryText
        paletteButton.tintColor = palette.secondaryText
        
        let menuIcon = state.isMenuOpen ? "xmark" : "line.3.horizontal"
        menuButton.setImage(UIImage(systemName: menuIcon), for: .normal)
        
        let themeIcon = state.isDarkMode ? "sun.max" : "moon"
        themeButton.setImage(UIImage(systemName: themeIcon), for: .normal)
        
        updateVisibilityForMode()
    }
    
    private func updateVisibilityForMode() {
        // In minimal mode, hide level/streak/XP info, show only menu and action buttons
        let hideInfo = isMinimal
        centerStack.isHidden = hideInfo
        levelLabel.isHidden = hideInfo
        streakLabel.isHidden = hideInfo
        xpLabel.isHidden = hideInfo
        progressView.isHidden = hideInfo
        
        // Force layout update
        leftStack.setNeedsLayout()
        contentStack.setNeedsLayout()
        setNeedsLayout()
        layoutIfNeeded()
    }

    private struct ThemePalette {
        let accent: UIColor
        let primaryText: UIColor
        let secondaryText: UIColor
        let backgroundAlpha: CGFloat
        let trackAlpha: CGFloat
    }

    private func themePalette(for theme: String, isDarkMode: Bool) -> ThemePalette {
        switch theme {
        case "summer":
            return ThemePalette(
                accent: UIColor(red: 74/255, green: 222/255, blue: 128/255, alpha: 1.0), // green-400
                primaryText: isDarkMode
                    ? UIColor(red: 229/255, green: 231/255, blue: 235/255, alpha: 1.0) // gray-200
                    : UIColor(red: 17/255, green: 24/255, blue: 39/255, alpha: 1.0), // gray-900
                secondaryText: isDarkMode
                    ? UIColor(red: 156/255, green: 163/255, blue: 175/255, alpha: 1.0) // gray-400
                    : UIColor(red: 75/255, green: 85/255, blue: 99/255, alpha: 1.0), // gray-600
                backgroundAlpha: isDarkMode ? 0.18 : 0.14,
                trackAlpha: isDarkMode ? 0.35 : 0.22
            )
        case "autumn":
            return ThemePalette(
                accent: UIColor(red: 249/255, green: 115/255, blue: 22/255, alpha: 1.0), // orange-500
                primaryText: isDarkMode
                    ? UIColor(red: 254/255, green: 243/255, blue: 230/255, alpha: 1.0) // warm cream
                    : UIColor(red: 67/255, green: 20/255, blue: 7/255, alpha: 1.0), // brown-900
                secondaryText: isDarkMode
                    ? UIColor(red: 253/255, green: 186/255, blue: 116/255, alpha: 1.0) // orange-300
                    : UIColor(red: 120/255, green: 53/255, blue: 15/255, alpha: 1.0), // amber-800
                backgroundAlpha: isDarkMode ? 0.18 : 0.14,
                trackAlpha: isDarkMode ? 0.35 : 0.22
            )
        case "winter":
            fallthrough
        default:
            return ThemePalette(
                accent: UIColor(red: 56/255, green: 189/255, blue: 248/255, alpha: 1.0), // sky-400
                primaryText: isDarkMode
                    ? UIColor(red: 226/255, green: 232/255, blue: 240/255, alpha: 1.0) // slate-200
                    : UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0), // slate-900
                secondaryText: isDarkMode
                    ? UIColor(red: 148/255, green: 163/255, blue: 184/255, alpha: 1.0) // slate-400
                    : UIColor(red: 71/255, green: 85/255, blue: 105/255, alpha: 1.0), // slate-600
                backgroundAlpha: isDarkMode ? 0.18 : 0.14,
                trackAlpha: isDarkMode ? 0.35 : 0.22
            )
        }
    }

    @objc private func handleMenuTap() {
        onAction?("menu")
    }
    
    @objc private func handleAchievementsTap() {
        onAction?("achievements")
    }
    
    @objc private func handleThemeTap() {
        onAction?("theme")
    }
    
    @objc private func handlePaletteTap() {
        onAction?("colorTheme")
    }
}

@objc(NativeGamificationBarPlugin)
public class NativeGamificationBarPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeGamificationBarPlugin"
    public let jsName = "NativeGamificationBar"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setState", returnType: CAPPluginReturnPromise)
    ]
    
    @objc func setState(_ call: CAPPluginCall) {
        let visible = call.getBool("visible") ?? false
        let minimal = call.getBool("minimal") ?? false
        let view = call.getString("view") ?? ""
        let activeView = call.getString("activeView") ?? view
        let menuView = call.getString("menuView")
        let colorTheme = call.getString("colorTheme") ?? "winter"
        let levelText = call.getString("levelText") ?? ""
        let streakText = call.getString("streakText") ?? ""
        let xpText = call.getString("xpText") ?? ""
        let progress = Float(call.getDouble("progress") ?? 0)
        let isMenuOpen = call.getBool("isMenuOpen") ?? false
        let isDarkMode = call.getBool("isDarkMode") ?? false
        
        let state = NativeGamificationBarState(
            visible: visible,
            minimal: minimal,
            view: view,
            activeView: activeView,
            menuView: menuView,
            colorTheme: colorTheme,
            levelText: levelText,
            streakText: streakText,
            xpText: xpText,
            progress: progress,
            isMenuOpen: isMenuOpen,
            isDarkMode: isDarkMode
        )
        
        DispatchQueue.main.async {
            NativeGamificationBarManager.shared.updateState(state)
        }
        call.resolve()
    }
}
