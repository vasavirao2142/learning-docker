FROM node:latest


WORKDIR /app


COPY ./package.json ./package.json

COPY ./package-lock.json ./package-lock.json

RUN npm install 

COPY . .

# 1 to 13 lines are called layers they help in caching when the layers did not change so it optimises the build process
# 19 and 21 lines are not layers
# just expose the port and last line will execute when we call the docker run then it will execute

EXPOSE 3000  

CMD ["npm","start"]