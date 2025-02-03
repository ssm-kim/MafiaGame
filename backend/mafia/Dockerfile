#backend/mafia/Dockerfile
FROM amazoncorretto:17
ARG JAR_FILE=./build/libs/mafia-0.0.1-SNAPSHOT.jar
ARG PROFILE
WORKDIR /app
COPY ${JAR_FILE} app.jar
ENTRYPOINT ["java", "-Dspring.profiles.active=${PROFILE}", "-jar", "app.jar"]