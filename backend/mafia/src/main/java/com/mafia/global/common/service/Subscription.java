package com.mafia.global.common.service;

public interface Subscription {
    void subscribe(Long pk);
    void unsubscribe(Long pk);
}
