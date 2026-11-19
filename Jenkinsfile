// Pipeline para Jenkins en Windows (sin Docker).
// Requisitos en el servidor Jenkins: Node.js 20+ en el PATH (o plugin NodeJS) y plugins Git, Pipeline, JUnit, Coverage y HTML Publisher.
// El reporte Serenity BDD necesita Java 11+ (se usa el JDK 21 de Adoptium; ajusta JAVA21_HOME si está en otra ruta).
pipeline {
  agent any

  options {
    timestamps()
    timeout(time: 20, unit: 'MINUTES')
  }

  environment {
    CI = 'true'
    JAVA21_HOME = 'C:/Program Files/Eclipse Adoptium/jdk-21.0.11.10-hotspot'
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

    stage('Pruebas E2E (Serenity BDD)') {
      steps {
        bat 'npx playwright install chromium'
        // Genera target/site/serenity (JSON); si una prueba falla igualmente se publica el reporte
        bat 'npx playwright test'
      }
      post {
        always {
          withEnv(["JAVA_HOME=${env.JAVA21_HOME}", "PATH+JAVA=${env.JAVA21_HOME}/bin"]) {
            bat 'npm run serenity:report'
          }
          archiveArtifacts artifacts: 'target/site/serenity/**', allowEmptyArchive: true
          publishHTML(target: [
            reportName: 'Serenity Report',
            reportDir: 'target/site/serenity',
            reportFiles: 'index.html',
            keepAll: true,
            alwaysLinkToLastBuild: true,
            allowMissing: true
          ])
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
