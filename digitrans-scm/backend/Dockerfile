# ─── Stage 1 : Build Maven ────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17-alpine AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn clean package -DskipTests -q

# ─── Stage 2 : Image runtime légère ──────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S digitrans && adduser -S digitrans -G digitrans
COPY --from=builder /app/target/digitrans-scm-*.jar app.jar
USER digitrans
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "-Xms256m", "-Xmx512m", "app.jar"]
