FROM node:14-alpine AS development
ENV NODE_ENV development
# Add a work directory
WORKDIR /server
# Cache and Install dependencies
COPY package.json .
RUN npm install
# Copy app files
COPY . .
# Expose port
EXPOSE 8000
# Start the app
CMD [ "npm", "start" ]