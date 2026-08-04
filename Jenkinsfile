pipeline {
    agent any

    environment {
        BUILD_ID = 'dontKillMe'
        COMPOSE_FILE = 'docker-compose.yml'
    }

    triggers {
        githubPush()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo "Code checked out successfully"
            }
        }

        stage('Lint & Test') {
            parallel {
                stage('Go Backend') {
                    steps {
                        dir('backend-go') {
                            sh 'go vet ./...'
                            sh 'go test ./... -v'
                        }
                    }
                }
                stage('Python Trainer') {
                    steps {
                        dir('trainer') {
                            sh '''
                                pip3 install -r requirements.txt --quiet --break-system-packages
                                pip3 install pytest httpx --quiet --break-system-packages
                                python3 -m pytest test_app.py -v -k "not inference"
                            '''
                        }
                    }
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                echo "Building Docker images..."
                sh 'docker compose -f ${COMPOSE_FILE} build'
            }
        }

        stage('Deploy') {
            steps {
                sh 'docker compose -f ${COMPOSE_FILE} down --remove-orphans || true'
                sh 'docker rm -f ml_trainer ml_api ml_frontend || true'  
                sh 'docker compose -f ${COMPOSE_FILE} up -d --force-recreate'
                sleep 20
            }
        }

        stage('Health Checks') {
            steps {
                sh 'curl -sf http://localhost:8081/health || (echo "Go API is down" && exit 1)'
                sh 'curl -sf http://localhost:8000/health || (echo "Python Trainer is down" && exit 1)'
                sh 'curl -sf http://localhost:80    || (echo "Frontend is down" && exit 1)'
                echo "All services healthy"
            }
        }
    }

    post {
        always {
            sh 'docker compose -f ${COMPOSE_FILE} logs --no-color > compose_logs.txt 2>&1 || true'
            archiveArtifacts artifacts: 'compose_logs.txt', allowEmptyArchive: true
        }
        cleanup {
            //sh 'docker compose -f ${COMPOSE_FILE} down --remove-orphans || true'
            cleanWs()
        }
    }
}