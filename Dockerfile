FROM alpine:latest

#RUN apk update
#RUN apk add vim

COPY homedockyard /
RUN chmod +x /homedockyard

EXPOSE 9080
#USER 1000

ENTRYPOINT [ "/homedockyard" ]
