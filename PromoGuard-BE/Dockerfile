FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copy the built jar from target directory
COPY target/*.jar app.jar

# Run the jar with optimized JVM settings for container environments
ENTRYPOINT ["java", "-XX:+UseG1GC", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
