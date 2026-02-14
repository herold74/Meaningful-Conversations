module.exports = {
  apps: [{
    name: 'backend',
    script: 'server.js',
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '700M',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
