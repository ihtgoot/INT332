pipeline {
agent any

```
environment {
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
                        sh '''
                            go vet ./...
                            go test ./... -v
                        '''
                    }
                }
            }

            stage('Python Trainer') {
                steps {
                    dir('trainer') {
                        sh '''
                            python3 -m venv .venv
                            . .venv/bin/activate

                            python -m pip install --upgrade pip
                            pip install -r requirements.txt
                            pip install pytest httpx

                            pytest test_app.py -v -k "not inference"
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
            echo "Starting services..."
            sh 'docker compose -f ${COMPOSE_FILE} up -d'

            echo "Waiting for services..."
            sleep(time: 15, unit: 'SECONDS')
        }
    }

    stage('Health Checks') {
        steps {

            sh '''
                curl -sf http://localhost:8081/health \
                || (echo "Go API is down" && exit 1)
            '''

            sh '''
                curl -sf http://localhost:8000/health \
                || (echo "Python Trainer is down" && exit 1)
            '''

            sh '''
                curl -sf http://localhost:80 \
                || (echo "Frontend is down" && exit 1)
            '''

            echo "All services are healthy"
        }
    }
}

post {

    always {
        echo "Collecting logs..."

        sh '''
            docker compose -f ${COMPOSE_FILE} logs --no-color \
            > compose_logs.txt 2>&1 || true
        '''

        archiveArtifacts(
            artifacts: 'compose_logs.txt',
            allowEmptyArchive: true
        )
    }

    cleanup {
        echo "Stopping containers..."

        sh '''
            docker compose -f ${COMPOSE_FILE} down --remove-orphans \
            || true
        '''
    }
}
```

}
