// Pipeline for the Bitbucket repository: every branch runs type checks, unit tests with the
// coverage thresholds, end-to-end tests and the production build with its size budgets;
// develop asks Coolify to rebuild the site only after all of them pass.
// Requires the Docker Pipeline plugin and two "Secret text" credentials in Jenkins:
//   coolify-client-webhook  Deploy Webhook URL of the frontend application in Coolify
//   coolify-token           Coolify API token with deploy permission
pipeline {
    agent none

    options {
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds(abortPrevious: true)
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    stages {
        stage('Checks') {
            agent {
                docker {
                    // Same Playwright version as package-lock.json, with Node and Chromium installed.
                    image 'mcr.microsoft.com/playwright:v1.60.0-noble'
                    args '-v mte-npm-cache:/root/.npm -u root --ipc=host'
                }
            }
            environment {
                CI = 'true'
            }
            stages {
                stage('Install') {
                    steps {
                        sh 'npm ci'
                    }
                }
                stage('Type check') {
                    steps {
                        sh 'npm run typecheck'
                    }
                }
                stage('Unit tests and coverage') {
                    steps {
                        sh 'npm run test:coverage'
                    }
                }
                stage('E2E tests') {
                    steps {
                        sh 'npm run test:e2e'
                    }
                }
                stage('Build and size budgets') {
                    steps {
                        sh 'npm run build:verified'
                    }
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'coverage/**, playwright-report/**', allowEmptyArchive: true
                }
            }
        }

        stage('Deploy') {
            when { branch 'develop' }
            agent any
            steps {
                withCredentials([
                    string(credentialsId: 'coolify-client-webhook', variable: 'COOLIFY_WEBHOOK'),
                    string(credentialsId: 'coolify-token', variable: 'COOLIFY_TOKEN')
                ]) {
                    // Single quotes keep the secrets out of Groovy interpolation and the build log.
                    sh 'curl -fsS --max-time 30 -X GET "$COOLIFY_WEBHOOK" -H "Authorization: Bearer $COOLIFY_TOKEN"'
                }
            }
        }
    }
}
