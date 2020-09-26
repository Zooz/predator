const config = {
    kubernetesUrl: process.env.KUBERNETES_URL,
    kubernetesToken: process.env.KUBERNETES_TOKEN,
    kubernetesNamespace: process.env.KUBERNETES_NAMESPACE
};

module.exports = config;
