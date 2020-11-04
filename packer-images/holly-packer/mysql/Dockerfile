FROM mysql:8.0
ADD config/my.cnf /etc/mysql/my.cnf
RUN mkdir -p /var/log/mysql && chown mysql:mysql /var/log/mysql
COPY schema/00* /docker-entrypoint-initdb.d/
