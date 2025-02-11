package com.mafia.domain.mattermost.dto;

import com.google.gson.annotations.SerializedName;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

public class MatterMostMessageDTO {

    @Getter
    public static class Attachments {

        private Props props;
        private List<Attachment> attachments = new ArrayList<>();

        public Attachments(Attachment attachment) {
            this.attachments.add(attachment);
        }

        public void addProps(Exception e) {
            props = new Props(e);
        }
    }

    @Getter
    @AllArgsConstructor
    @Builder
    public static class Attachment {

        private String channel;
        private String pretext;
        private String color;

        @SerializedName("author_name")
        private String authorName;


        private String title;
        private String text;
        private String footer;

        public Attachment addExceptionInfo(Exception e, String uri, String params) {
            this.title = e.getClass().getSimpleName();
            this.text = String.format("""
                **Error Message**
                ```
                %s
                ```
                
                **Request URL**
                %s
                
                **Parameters**
                ```
                %s
                ```
                """, e.getMessage(), uri, params);
            return this;
        }
    }

    @Getter
    @NoArgsConstructor
    public static class Props {

        private String card;

        public Props(Exception e) {
            StringWriter sw = new StringWriter();
            e.printStackTrace(new PrintWriter(sw));
            this.card = "**Stack Trace**\n```" + sw.toString()
                .substring(0, Math.min(5500, sw.toString().length())) + "\n...```";
        }
    }
}