import {
  ArrowLeft,
  FileText,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";


const TermsConditions = () => {

  const navigate =
    useNavigate();


  return (

    <div className="player-terms-page">

      <div className="player-terms-page-card">

        {/* HEADER */}

        <div className="player-terms-page-header">

          <button
            type="button"
            className="player-terms-back"
            onClick={() =>
              navigate(-1)
            }
          >
            <ArrowLeft size={20} />
          </button>


          <div>

            <span className="player-terms-page-brand">
              GOLD BINGO
            </span>

            <h1>
              Terms and
              <br />
              Conditions
            </h1>

          </div>


          <div className="player-terms-page-icon">

            <FileText size={23} />

          </div>

        </div>


        {/* CONTENT */}

        <div className="player-terms-page-content">

          <h2>
            የጨዋታ ሕጎች
          </h2>


          <ol className="player-terms-list">

  <li>
    4ቱ የመአዘን ኳስ እንደ አንድ
    መስመር አይታሰብም።
  </li>

  <li>
    ካርቴላ የተሰጠውን ጨዋታ
    በትክክል ሰርቶ እያለ ነገር ግን
    የመጨረሻ ቁጥር (Active Number)
    በሰራው ቢንጎ ውስጥ ከሌለ
    ይህ ትክክለኛ አሸናፊ አይደለም።
  </li>

  <li>
    ከአንድ በላይ ካርቴላ አሸናፊ
    ከሆኑ ምንም ለውጥ ሳያመጣ
    ሁሉንም አሸናፊ ይሆናል፤
    ሽልማቱም ለሁሉም በእኩል
    ይካፈላል።
  </li>

  <li>
    5ቱ ቀን እና ከዚያ በላይ
    በፊት በቴሌብር ይሁን በሲቢኢ
    ባንክ የተላከ ገንዘብ ዲፖዚት
    መደረግ አይችልም፤ በ4ቱ ቀን
    ውስጥ ገቢ መደረግ አለበት።
  </li>

  <li>
    በደንበኞቻችን በኩል
    የኮኔክሽን ችግር ለሚነሱ
    አቤቱታዎች ምንም አይነት
    ተቀባይነት የላቸውም።
  </li>

</ol>

        </div>


        {/* FOOTER */}

        <div className="player-terms-page-footer">

          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
          >
            Close
          </button>

        </div>

      </div>

    </div>

  );

};


export default TermsConditions;