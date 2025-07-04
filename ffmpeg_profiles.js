// 支持的profile字典（main10/main10p/HDR等）
const profiles = {
    'libx264': [
        { value: 'baseline', text: 'Baseline' },
        { value: 'main', text: 'Main' },
        { value: 'high', text: 'High' }
    ],
    'libx265': [
        { value: 'main', text: 'Main' },
        { value: 'main10', text: 'Main10p' },
        { value: 'mainstillpicture', text: 'MainStillPicture' },
        { value: 'rext', text: 'Rext' }
    ]
};

// profile version字典
const profileVersions = {
    'libx264': {
        'baseline': ["", "3.0", "3.1", "4.0"],
        'main': ["", "3.0", "3.1", "4.0"],
        'high': ["", "4.0"]
    },
    'libx265': {
        'main': ["", "5.0", "5.1", "5.2", "6.0", "6.1", "6.2"],
        'main10': ["", "5.0", "5.1", "5.2", "6.0", "6.1", "6.2"],
        'mainstillpicture': ["", "5.0", "5.1", "5.2", "6.0", "6.1", "6.2"],
        'rext': ["", "5.0", "5.1", "5.2", "6.0", "6.1", "6.2"]
    }
};
