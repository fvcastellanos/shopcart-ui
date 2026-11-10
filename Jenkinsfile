def repositoryUrl = 'https://github.com/fvcastellanos/shopcart-ui.git'
def registryUrl = 'registry.devcoregt.com'
def registryImage = "${registryUrl}/apps/shopcart-ui"
def imageName = "${registryImage}:latest"
def dockerfilePath = './docker/Dockerfile'
def nodeImageName = 'node:26-bookworm-slim'

node {
    deleteDir()

    try {
        withCredentials([
            usernamePassword(credentialsId: 'zot-registry', usernameVariable: 'REGISTRY_USR', passwordVariable: 'REGISTRY_PSW')
        ]) {

            stage('Checkout') {
                checkout scm: scmGit(
                    branches: [[name: 'main']],
                    extensions: [[$class: 'CleanBeforeCheckout']],
                    userRemoteConfigs: [[
                        credentialsId: 'github-credentials',
                        url: repositoryUrl
                    ]]
                )
            }

            stage('Run Tests') {
                docker.image(nodeImageName)
                        .inside {
                            sh """
                              npm i
                              npm run typecheck
                            """
                        }
            }

            stage('Build Docker Image') {
                sh """
                    docker build -f ${dockerfilePath} -t ${imageName} .
                """
            }

            stage('Push to Registry') {
                sh """
                    echo ${REGISTRY_PSW} | docker login ${registryUrl} --username ${REGISTRY_USR} --password-stdin
                    docker push ${imageName}
                    docker logout ${registryUrl}
                """
            }
        }
    } catch (Exception exception) {
        echo "An error occurred: ${exception.getMessage()}"
        currentBuild.result = 'FAILURE'
        throw exception
    } finally {
        sh """
            docker logout || true
            docker rmi -f ${imageName} ${nodeImageName} || true
        """
    }
}
