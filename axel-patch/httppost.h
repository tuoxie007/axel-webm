#include <stdio.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <stdlib.h>
#include <netdb.h>
#include <string.h>

char* http_post(char *host, char *page, char *data);
char *build_post_query(char *host, char *page, char *data);
