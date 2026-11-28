FROM quay.io/keycloak/keycloak:26.8.2

ENV KC_DB=postgres

RUN /opt/keycloak/bin/kc.sh build

COPY --chown=1000:0 --chmod=755 render-entrypoint.sh /opt/keycloak/bin/render-entrypoint.sh

ENTRYPOINT ["/opt/keycloak/bin/render-entrypoint.sh"]
CMD ["start", "--optimized"]
