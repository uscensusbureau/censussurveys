var Airtable = require("airtable");
var base = new Airtable({ apiKey: "keyWfSmHAolRQJxTk" }).base(
  "appAzdZwdzJzHt494"
);

/**
 * Handles edge case "Other", where the card's tag in
 * Airtable is different than the text shown on the card.
 */
function renameFilters(text) {
  text = text.replace("Other Geos", "Other");
  text = text.replace("Other Freqs", "Other");
  return text;
}

const modal = ({ title, description, freqs, geos, topics, subs, id, href }) => `
<div class="modal fade" id="${id}" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="exampleModalLabel"><a href="${href}">${title} →</a></h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <h4>Description</h4>
            ${description}
          <h4 style="margin-top: 16px;">Frequencies</h4>
            ${freqs}
          <h4 style="margin-top: 16px;">Geographies</h4>
            ${geos}
          <h4 style="margin-top: 16px;">Topics</h4>
            ${topics}
          <h4 style="margin-top: 16px;">Subtopics</h4>
            ${subs}
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
</div>
`;
/**
 * Creates alphabetized survey cards on homepage
 * using Airtable API. For each card, writes the selected filters
 * into the body copy and writes them as class names for use in filtering.
 */
base("Surveys")
  .select({
    // Selecting the Developer view on the base and specific fields:
    view: "Developer",
    fields: [
      "Survey",
      "Description",
      "Link",
      "Frequency",
      "Geography",
      "Subtopics",
      "Topic",
    ],
  })
  .eachPage(
    // each page is equivalent to 100 records
    function page(records, fetchNextPage) {
      // This function (`page`) will get called for each page of records.

      /**
       *  Creates an array of two variables, with the
       * first being the card's text for the category
       * and the second being the filtered version of the text
       * to write into each survey's card's classes.
       */

      function createFilters(category, record) {
        recordText = record.get(category);
        var text = recordText.join(", ");
        var filter = recordText
          .map((str) => str.replace(/\s/g, "").replace("/", ""))
          .join(" ")
          .toLowerCase();
        return [renameFilters(text), filter];
      }

      records.forEach(function (record, idx) {
        // Card Title and Description
        title = record.get("Survey");
        link = record.get("Link");
        text = record.get("Description");
        const id = title.split(" ").join("-");

        const short_text =
          (text.length > 250 &&
            text.substring(0, 250) +
              `<button class="modal-button" data-toggle="modal" data-target="#m${id}">...more</button>`) ||
          text;

        // Creating filters and record text
        frequencies = createFilters("Frequency", record);
        geos = createFilters("Geography", record);
        topics = createFilters("Topic", record);
        subtopics = createFilters("Subtopics", record);

        const short_subtopics =
          (subtopics[0].length > 50 &&
            subtopics[0].substring(0, 50) +
              `<button class="modal-button" data-toggle="modal" data-target="#m${id}">...more</button>`) ||
          subtopics[0];

        const this_modal = modal({
          title,
          topics: topics[0],
          freqs: frequencies[0],
          geos: geos[0],
          subs: subtopics[0],
          description: text,
          id: `m${id}`,
          href: link,
        });

        // Creating parent card
        var $card = $("<div/>", {
          class:
            "col card mb-3 " +
            frequencies[1] +
            " " +
            geos[1] +
            " " +
            subtopics[1] +
            " " +
            topics[1] +
            " ",
        });

        //$card.append(subtopics_modal);

        // Creating card body
        var $cardBody = $("<div/>", {
          class: "card-body",
        });

        // Creating card dividers
        var $cardDividers = $("<ul/>", {
          class: "list-group",
        });

        // Appending card and card body with text and title
        $cardBody.append(
          "<h5 class='card-title'><a target='_blank' href=" +
            link +
            ">" +
            title +
            " →</a></h5>"
        );
        $cardBody.append("<p class='card-text'>" + short_text + "</p>");
        $card.append($cardBody).append(this_modal);
        //  .append(description_modal);

        // Appending card dividers with filters information
        $card.append($cardDividers);
        $cardDividers.append(
          "<li class='list-group-item'>" +
            "<b>Frequencies: </b>" +
            frequencies[0] +
            "&nbsp;</li>"
        );
        $cardDividers.append(
          "<li class='list-group-item'>" +
            "<b>Geographies: </b>" +
            geos[0] +
            "&nbsp;</li>"
        );
        $cardDividers.append(
          "<li class='list-group-item'>" +
            "<b>Topics: </b>" +
            topics[0] +
            "&nbsp;</li>"
        );
        $cardDividers.append(
          "<li class='list-group-item'>" +
            "<b>Subtopics: </b>" +
            short_subtopics +
            "&nbsp;</li>"
        );
        //var $cardCol = $("<div/>", {
        //  class: "col",
        //});
        //$cardCol.append($card);
        // Appending to the home page #cards
        //$("#cards").append($cardCol);
        $("#cards").append($card);
      });

      // To fetch the next page of records, call `fetchNextPage`.
      // If there are more records, `page` will get called again.
      // If there are no more records, `done` will get called.
      fetchNextPage();
    },
    function done(err) {
      if (err) {
        console.error(err);
        return;
      }
    }
  );

/**
 * Creates alphabetized filter dropdowns for "Topics" view for
 * subtopics and topics dropdowns. For each filter, creates a checkbox and
 * sorts and appends them to the appropriate dropdown.
 */
base("Filters")
  .select({
    view: "Topics",
    fields: ["Filter", "Type", "Publish?"],
  })
  .eachPage(
    function page(records, fetchNextPage) {
      // This function (`page`) will get called for each page of records.

      records.forEach(function (record) {
        recordText = record.get("Filter");
        if (!recordText) return;
        recordType = record.get("Type");
        publish = record.get("Publish?");
        var filter = recordText
          .replace(/\s/g, "")
          .replace("/", "")
          .toLowerCase();

        var $checkbox =
          "<li><input type='checkbox' id=" +
          filter +
          " value='" +
          recordText +
          "' title=" +
          recordText +
          " class='filterCheckbox' /> " +
          recordText +
          "</li>";

        if (publish == "Yes") {
          if (recordType == "Subtopics") {
            $("#subtopicsFilters").append($checkbox);
          }
          if (recordType == "Topics") {
            $("#topicFilters").append($checkbox);
          }
        }
      });

      // To fetch the next page of records, call `fetchNextPage`.
      // If there are more records, `page` will get called again.
      // If there are no more records, `done` will get called.
      fetchNextPage();
    },
    function done(err) {
      if (err) {
        console.error(err);
        return;
      }
    }
  );

/**
 * Creates unalphabetized filter dropdowns for "Geos & Freqs" view for
 * frequency and geography dropdowns. For each filter, creates a checkbox and
 * sorts and appends them to the appropriate dropdown.
 */
base("Filters")
  .select({
    // Selecting the first 3 records in Developer:
    view: "Geos & Freqs",
    fields: ["Filter", "Type", "Publish?"],
  })
  .eachPage(
    function page(records, fetchNextPage) {
      // This function (`page`) will get called for each page of records.

      records.forEach(function (record) {
        recordText = record.get("Filter");
        if (!recordText) return;
        recordType = record.get("Type");
        publish = record.get("Publish?");
        var filter = recordText
          .replace(/\s/g, "")
          .replace("/", "")
          .toLowerCase();

        var $checkbox =
          "<li><input type='checkbox' id=" +
          filter +
          " value='" +
          renameFilters(recordText) +
          "' title=" +
          renameFilters(recordText) +
          " class='filterCheckbox' /> " +
          renameFilters(recordText) +
          "</li>";

        if (publish == "Yes") {
          if (recordType == "Geographies") {
            $("#geographyFilters").append($checkbox);
          }
          if (recordType == "Frequencies") {
            $("#frequencyFilters").append($checkbox);
          }
        }
      });

      // To fetch the next page of records, call `fetchNextPage`.
      // If there are more records, `page` will get called again.
      // If there are no more records, `done` will get called.
      fetchNextPage();
    },
    function done(err) {
      if (err) {
        console.error(err);
        return;
      }
    }
  );
