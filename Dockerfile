FROM node:8-jessie

# By default image is built using NODE_ENV=production.
# You may want to customize it:
#
#   --build-arg NODE_ENV=development
#
# See https://docs.docker.com/engine/reference/commandline/build/#set-build-time-variables-build-arg
#
ARG NODE_ENV=production
ARG APP_PORT=8080
ENV NODE_ENV=${NODE_ENV} APP_PORT=${APP_PORT} APP_ROOT=/home/app

# Add Tini.
ENV TINI_VERSION v0.18.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini.asc /tini.asc
RUN gpg --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys 595E85A6B1B4779EA4DAAEC70B588DFF0527A9B7 \
 && gpg --verify /tini.asc
RUN chmod +x /tini
ENTRYPOINT ["/tini", "--"]

# Configure time zone.
ENV TZ=UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime \
 && echo $TZ > /etc/timezone \
 && dpkg-reconfigure -f noninteractive tzdata

# Allow customization of user ID and group ID (it's useful when you use Docker bind mounts).
ARG UID=1001
ARG GID=1001

 # Create group "app" and user "app".
RUN groupadd -r --gid ${GID} app \
 && useradd --system --create-home --home ${APP_ROOT} --shell /sbin/nologin --no-log-init --gid ${GID} --uid ${UID} app \
 # Install system dependencies.
 && apt-get update \
 && apt-get install -y --no-install-recommends locales

# Configure locale.
RUN locale-gen en_US.UTF-8
ENV LANG=en_US.UTF-8

# Expose port to the Docker host, so we can access it from the outside.
EXPOSE $APP_PORT

# The main command to run when the container starts.
CMD ["node", "index.js"]

WORKDIR $APP_ROOT

# Install Gemfile dependencies.
COPY package.json package-lock.json $APP_ROOT/
RUN npm install

# Copy application sources.
COPY --chown=app:app . $APP_ROOT

# Switch to application user.
USER app
