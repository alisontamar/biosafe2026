// Pipeline para Jenkins en Windows (sin Docker).
// Requisitos en el servidor Jenkins: Node.js 20+ en el PATH (o plugin NodeJS) y plugins Git, Pipeline y JUnit.
pipeline {
  agent any

  options {
    timestamps()
    timeout(time: 20, unit: 'MINUTES')
  }

  environment {
    CI = 'true'
  }

  stages {
    stage('Versiones') {
      steps {
        bat 'node -v && npm -v'
      }
    }

    stage('Instalar dependencias') {
      steps { bat 'npm ci' }
    }

    stage('Typecheck') {
      steps { bat 'npm run typecheck' }
    }

    stage('Tests unitarios') {
      steps {
        // Reporte JUnit para Jenkins + cobertura en coverage/
        bat 'npx vitest run --coverage --reporter=default --reporter=junit --outputFile.junit=reports/junit.xml'
      }
      post {
        always {
          junit allowEmptyResults: true, testResults: 'reports/junit.xml'
          archiveArtifacts artifacts: 'coverage/**', allowEmptyArchive: true
          // Gráfica de cobertura en Jenkins (requiere el plugin "Coverage")
          recordCoverage(
            tools: [[parser: 'COBERTURA', pattern: 'coverage/cobertura-coverage.xml']],
            sourceCodeRetention: 'EVERY_BUILD'
          )
        }
      }
    }

    stage('Build') {
      steps { bat 'npm run build' }
    }
  }

  post {
    success { echo 'Todo en verde.' }
    failure { echo 'Pipeline fallido: revisa el reporte de tests.' }
  }
}
