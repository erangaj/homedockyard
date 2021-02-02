FROM alpine:latest

#RUN apk update
#RUN apk add vim

COPY homedockyard /
RUN apk update && apk add py3-pip python3-dev libffi-dev openssl-dev gcc libc-dev make && rm -rf /var/cache/apk/*
RUN pip install docker-compose
RUN cp /usr/bin/docker-compose /usr/local/bin/docker-compose
RUN chmod +x /homedockyard

VOLUME /config

EXPOSE 9080
#USER 1000

ENTRYPOINT [ "/homedockyard" ]
